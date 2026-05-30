import fs from 'fs'
import path from 'path'
import { EPISODES_BASE } from '@/lib/paths'
import { validateVideoId } from '@/lib/validate'

export async function GET(
  _request: Request,
  { params }: { params: { videoId: string } }
) {
  const { videoId } = params

  if (!validateVideoId(videoId)) {
    return Response.json({ error: 'Invalid videoId' }, { status: 400 })
  }

  const episodeDir = path.join(EPISODES_BASE, videoId)

  let meta: unknown
  try {
    const raw = fs.readFileSync(path.join(episodeDir, 'meta.json'), 'utf-8')
    meta = JSON.parse(raw)
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }
    throw err
  }

  let segments: unknown
  try {
    const raw = fs.readFileSync(path.join(episodeDir, 'segments.json'), 'utf-8')
    segments = JSON.parse(raw)
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }
    throw err
  }

  return Response.json({ meta, segments })
}
