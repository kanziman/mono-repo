import os from 'os'
import fs from 'fs'
import path from 'path'

export const SHADOWING_BASE = path.join(os.homedir(), '.shadowing')
export const EPISODES_BASE = path.join(SHADOWING_BASE, 'episodes')

export function ensureEpisodeDir(videoId: string): string {
  const episodeDir = path.join(EPISODES_BASE, videoId)
  fs.mkdirSync(episodeDir, { recursive: true })
  return episodeDir
}
