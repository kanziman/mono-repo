import path from 'path'
import { EPISODES_BASE } from './paths'

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

export function validateVideoId(id: string): boolean {
  return VIDEO_ID_REGEX.test(id)
}

export function getEpisodePath(videoId: string): string {
  if (!validateVideoId(videoId)) {
    throw new Error(`Invalid videoId: ${videoId}`)
  }
  const resolved = path.resolve(EPISODES_BASE, videoId)
  if (!resolved.startsWith(EPISODES_BASE + path.sep) && resolved !== EPISODES_BASE) {
    throw new Error(`Path traversal detected for videoId: ${videoId}`)
  }
  return resolved
}

export function getFilePath(videoId: string, filename: string): string {
  return path.join(getEpisodePath(videoId), filename)
}
