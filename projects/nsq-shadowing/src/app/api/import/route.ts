export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { validateVideoId } from '@/lib/validate'
import { ensureEpisodeDir } from '@/lib/paths'
import { downloadAudio, downloadSubtitle, getVideoTitle } from '@/lib/ytdlp'
import { vttToSegments } from '@/lib/vtt'
import { translateAllSegments } from '@/lib/translate'
import type { EpisodeMeta } from '@/types'

const importing = new Set<string>()

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { videoId?: string }
  const { videoId } = body

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

        // Step 1: download audio
        enqueue({ step: 'download', progress: 0, done: false })
        await downloadAudio(videoUrl, episodeDir)
        enqueue({ step: 'download', progress: 100, done: false })

        // Step 2: subtitle
        enqueue({ step: 'subtitle', progress: 0, done: false })
        const vttContent = await downloadSubtitle(videoUrl, episodeDir)
        const segments = vttToSegments(vttContent)
        enqueue({ step: 'subtitle', progress: 100, done: false })

        // Step 3: translate
        enqueue({ step: 'translate', progress: 0, done: false })
        const translated = await translateAllSegments(
          segments,
          episodeDir,
          (done, total) => {
            enqueue({ step: 'translate', progress: Math.round((done / total) * 100), done: false })
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

        enqueue({ step: 'translate', progress: 100, done: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
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
