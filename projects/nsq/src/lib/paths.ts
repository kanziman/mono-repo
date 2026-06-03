import fs from 'fs'
import path from 'path'

export const SHADOWING_BASE = path.join(process.cwd(), '.shadowing')
export const EPISODES_BASE = path.join(SHADOWING_BASE, 'episodes')

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

export function ensureEpisodeDir(videoId: string): string {
  if (!VIDEO_ID_REGEX.test(videoId)) {
    throw new Error(`Invalid videoId: ${videoId}`)
  }
  const episodeDir = path.resolve(EPISODES_BASE, videoId)
  if (!episodeDir.startsWith(EPISODES_BASE + path.sep)) {
    throw new Error(`Path traversal detected for videoId: ${videoId}`)
  }
  fs.mkdirSync(episodeDir, { recursive: true })
  return episodeDir
}
