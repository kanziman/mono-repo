import fs from 'fs'
import path from 'path'
import { EPISODES_BASE } from '@/lib/paths'
import type { EpisodeMeta } from '@/types'

export async function GET() {
  if (!fs.existsSync(EPISODES_BASE)) {
    return Response.json([])
  }

  const entries = fs.readdirSync(EPISODES_BASE, { withFileTypes: true })
  const metas: EpisodeMeta[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const metaPath = path.join(EPISODES_BASE, entry.name, 'meta.json')
    try {
      const raw = fs.readFileSync(metaPath, 'utf-8')
      const meta: EpisodeMeta = JSON.parse(raw)
      metas.push(meta)
    } catch {
      continue
    }
  }

  metas.sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime())

  return Response.json(metas)
}
