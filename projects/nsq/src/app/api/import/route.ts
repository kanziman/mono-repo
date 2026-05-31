export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { validateVideoId } from '@/lib/validate'
import { ensureEpisodeDir } from '@/lib/paths'
import { downloadAudio, downloadSubtitle, downloadThumbnail, getVideoTitle } from '@/lib/ytdlp'
import { vttToSegments } from '@/lib/vtt'
import { translateAllSegments } from '@/lib/translate'
import type { EpisodeMeta, ImportStep } from '@/types'

type StepStatus = 'pending' | 'in_progress' | 'done' | 'error'

interface ImportState {
  videoId: string
  startedAt: string
  updatedAt: string
  steps: {
    download: StepStatus
    subtitle: StepStatus
    translate: StepStatus
  }
  error: string | null
}

function loadState(episodeDir: string): ImportState {
  const statePath = path.join(episodeDir, 'import-state.json')
  if (fs.existsSync(statePath)) {
    try {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8')) as ImportState
    } catch {
      // corrupt state — start fresh
    }
  }
  return {
    videoId: '',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: { download: 'pending', subtitle: 'pending', translate: 'pending' },
    error: null,
  }
}

function saveState(episodeDir: string, state: ImportState): void {
  state.updatedAt = new Date().toISOString()
  fs.writeFileSync(path.join(episodeDir, 'import-state.json'), JSON.stringify(state, null, 2), 'utf-8')
}

function appendLog(episodeDir: string, msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  fs.appendFileSync(path.join(episodeDir, 'import.log'), line, 'utf-8')
}

const importing = new Set<string>()

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { videoId?: string; fromStep?: ImportStep }
  const { videoId, fromStep } = body

  if (!videoId || !validateVideoId(videoId)) {
    return new Response('Invalid videoId', { status: 400 })
  }

  if (importing.has(videoId)) {
    return new Response('Already importing', { status: 409 })
  }

  importing.add(videoId)

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: object) => controller.enqueue(new TextEncoder().encode(sseEvent(data)))

      try {
        const episodeDir = ensureEpisodeDir(videoId)
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

        const state = loadState(episodeDir)
        state.videoId = videoId
        if (!state.startedAt) state.startedAt = new Date().toISOString()
        saveState(episodeDir, state)
        appendLog(episodeDir, `import started: ${videoId}`)
        if (fromStep) {
          const STEP_ORDER: ImportStep[] = ['download', 'subtitle', 'translate']
          const idx = STEP_ORDER.indexOf(fromStep)
          if (idx !== -1) {
            STEP_ORDER.slice(idx).forEach((s) => { state.steps[s] = 'pending' })
            saveState(episodeDir, state)
            appendLog(episodeDir, `resume from step: ${fromStep}`)
          }
        }

        // Step 1: download audio + thumbnail
        if (state.steps.download === 'done') {
          enqueue({ step: 'download', progress: 100, done: false })
          appendLog(episodeDir, 'download: skipped (already done)')
        } else {
          enqueue({ step: 'download', progress: 0, done: false })
          state.steps.download = 'in_progress'
          saveState(episodeDir, state)

          await downloadAudio(videoUrl, episodeDir, (pct) => {
            enqueue({ step: 'download', progress: pct, done: false })
          })
          await downloadThumbnail(videoUrl, episodeDir)

          state.steps.download = 'done'
          saveState(episodeDir, state)
          appendLog(episodeDir, 'download: done')
          enqueue({ step: 'download', progress: 100, done: false })
        }

        // Step 2: subtitle
        let segments: ReturnType<typeof vttToSegments>
        if (state.steps.subtitle === 'done') {
          enqueue({ step: 'subtitle', progress: 100, done: false })
          appendLog(episodeDir, 'subtitle: skipped (already done)')
          // Load cached subtitle to get segments for translate step
          const vttFile = fs.readdirSync(episodeDir).find((f) => f.startsWith('subtitle.') && f.endsWith('.vtt'))
          if (!vttFile) throw new Error('Subtitle file not found despite subtitle step marked done')
          segments = vttToSegments(fs.readFileSync(path.join(episodeDir, vttFile), 'utf-8'))
        } else {
          enqueue({ step: 'subtitle', progress: 0, done: false })
          state.steps.subtitle = 'in_progress'
          saveState(episodeDir, state)
          enqueue({ step: 'subtitle', progress: 10, done: false })

          const vttContent = await downloadSubtitle(videoUrl, episodeDir, () => {
            enqueue({ step: 'subtitle', progress: 60, done: false })
          })
          segments = vttToSegments(vttContent)

          state.steps.subtitle = 'done'
          saveState(episodeDir, state)
          appendLog(episodeDir, 'subtitle: done')
          enqueue({ step: 'subtitle', progress: 100, done: false })
        }

        // Step 3: translate
        if (state.steps.translate === 'done') {
          enqueue({ step: 'translate', progress: 100, done: true })
          appendLog(episodeDir, 'translate: skipped (already done)')
        } else {
          enqueue({ step: 'translate', progress: 0, done: false })
          state.steps.translate = 'in_progress'
          saveState(episodeDir, state)

          const chunks = Math.ceil(segments.length / 50)
          appendLog(episodeDir, `translate: started (${segments.length} segments, ${chunks} chunks)`)

          const translated = await translateAllSegments(
            segments,
            episodeDir,
            (done, total) => {
              const progress = Math.round((done / total) * 100)
              enqueue({ step: 'translate', progress, done: false })
              appendLog(episodeDir, `translate progress: ${done}/${total} (${progress}%)`)
            }
          )

          // Save segments.json
          fs.writeFileSync(path.join(episodeDir, 'segments.json'), JSON.stringify(translated), 'utf-8')

          // Save meta.json
          const title = await getVideoTitle(videoUrl)
          const durationSec = translated.length > 0 ? translated[translated.length - 1].end : 0
          const meta: EpisodeMeta = {
            videoId,
            title,
            durationSec,
            thumbnailUrl: `/api/thumbnail/${videoId}`,
            importedAt: new Date().toISOString(),
          }
          fs.writeFileSync(path.join(episodeDir, 'meta.json'), JSON.stringify(meta), 'utf-8')

          state.steps.translate = 'done'
          saveState(episodeDir, state)
          appendLog(episodeDir, 'translate: done')
          appendLog(episodeDir, 'import complete')
          enqueue({ step: 'translate', progress: 100, done: true })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        try {
          const episodeDir = ensureEpisodeDir(videoId)
          appendLog(episodeDir, `error: ${message}`)
        } catch {
          // ignore secondary error
        }
        controller.enqueue(
          new TextEncoder().encode(sseEvent({ step: 'download', progress: 0, done: true, error: message }))
        )
      } finally {
        importing.delete(videoId)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
