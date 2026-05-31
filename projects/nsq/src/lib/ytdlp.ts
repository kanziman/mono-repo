import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

export function parseYtDlpProgress(line: string): number | null {
  const m = line.match(/\[download\]\s+([\d.]+)%/)
  return m ? parseFloat(m[1]) : null
}

function runYtDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args)
    const stdout: string[] = []
    const stderr: string[] = []
    proc.stdout.on('data', (d: Buffer) => stdout.push(d.toString()))
    proc.stderr.on('data', (d: Buffer) => stderr.push(d.toString()))
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.join(''))
      } else {
        reject(new Error(`yt-dlp exited ${code}: ${stderr.join('')}`))
      }
    })
    proc.on('error', reject)
  })
}

function runYtDlpWithProgress(
  args: string[],
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args)
    const stdout: string[] = []
    const stderr: string[] = []
    proc.stdout.on('data', (d: Buffer) => stdout.push(d.toString()))
    proc.stderr.on('data', (d: Buffer) => {
      const text = d.toString()
      stderr.push(text)
      for (const line of text.split('\n')) {
        const pct = parseYtDlpProgress(line)
        if (pct !== null) onProgress(Math.min(99, Math.round(pct)))
      }
    })
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout.join(''))
      else reject(new Error(`yt-dlp exited ${code}: ${stderr.join('')}`))
    })
    proc.on('error', reject)
  })
}

export async function downloadAudio(
  videoUrl: string,
  outputDir: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  const args = [
    '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0',
    '-o', path.join(outputDir, 'audio.%(ext)s'), '--no-playlist', videoUrl,
  ]
  if (onProgress) {
    await runYtDlpWithProgress(args, onProgress)
  } else {
    await runYtDlp(args)
  }
}

export async function downloadSubtitle(
  videoUrl: string,
  outputDir: string,
  onFirstAttemptDone?: () => void
): Promise<string> {
  const vttGlob = (dir: string) =>
    fs.readdirSync(dir).find((f) => f.startsWith('subtitle.') && f.endsWith('.vtt'))

  // Try manual English subtitles first
  try {
    await runYtDlp([
      '--write-subs',
      '--sub-lang', 'en',
      '--skip-download',
      '-o', path.join(outputDir, 'subtitle.%(ext)s'),
      '--no-playlist',
      videoUrl,
    ])
    onFirstAttemptDone?.()
    const vtt = vttGlob(outputDir)
    if (vtt) return fs.readFileSync(path.join(outputDir, vtt), 'utf-8')
  } catch {
    onFirstAttemptDone?.()
    // fall through to auto-generated
  }

  // Fall back to auto-generated subtitles
  await runYtDlp([
    '--write-auto-subs',
    '--sub-lang', 'en',
    '--skip-download',
    '-o', path.join(outputDir, 'subtitle.%(ext)s'),
    '--no-playlist',
    videoUrl,
  ])
  const vtt = vttGlob(outputDir)
  if (!vtt) throw new Error('No English subtitle found for this video')
  return fs.readFileSync(path.join(outputDir, vtt), 'utf-8')
}

export async function downloadThumbnail(videoUrl: string, outputDir: string): Promise<void> {
  await runYtDlp([
    '--write-thumbnail',
    '--convert-thumbnails', 'jpg',
    '--skip-download',
    '-o', path.join(outputDir, 'thumbnail.%(ext)s'),
    '--no-playlist',
    videoUrl,
  ])
}

export async function getVideoTitle(videoUrl: string): Promise<string> {
  const output = await runYtDlp(['--get-title', '--no-playlist', videoUrl])
  return output.trim()
}
