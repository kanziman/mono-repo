import fs from 'fs'
import path from 'path'
import { EPISODES_BASE } from '@/lib/paths'
import type { EpisodeMeta, EpisodeEntry, StepStatus } from '@/types'

export async function GET() {
  if (!fs.existsSync(EPISODES_BASE)) {
    return Response.json([])
  }

  const entries = fs.readdirSync(EPISODES_BASE, { withFileTypes: true })
  const result: EpisodeEntry[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const metaPath = path.join(EPISODES_BASE, entry.name, 'meta.json')
    try {
      const meta: EpisodeMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      result.push({ ...meta, complete: true })
      continue
    } catch { /* no meta.json */ }

    const statePath = path.join(EPISODES_BASE, entry.name, 'import-state.json')
    try {
      const raw = JSON.parse(fs.readFileSync(statePath, 'utf-8')) as {
        videoId: string
        startedAt: string
        steps: { download: StepStatus; subtitle: StepStatus; translate: StepStatus }
        error: string | null
      }
      result.push({
        videoId: entry.name,
        complete: false,
        steps: raw.steps,
        error: raw.error,
        startedAt: raw.startedAt,
      })
    } catch { /* skip */ }
  }

  result.sort((a, b) => {
    if (a.complete && b.complete)
      return new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    if (a.complete) return -1
    if (b.complete) return 1
    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  })

  return Response.json(result)
}
