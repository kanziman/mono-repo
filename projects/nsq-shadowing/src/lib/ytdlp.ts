import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

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

export async function downloadAudio(videoUrl: string, outputDir: string): Promise<void> {
  await runYtDlp([
    '--extract-audio',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '-o', path.join(outputDir, 'audio.%(ext)s'),
    '--no-playlist',
    videoUrl,
  ])
}

export async function downloadSubtitle(videoUrl: string, outputDir: string): Promise<string> {
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
    const vtt = vttGlob(outputDir)
    if (vtt) return fs.readFileSync(path.join(outputDir, vtt), 'utf-8')
  } catch {
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

export async function getVideoTitle(videoUrl: string): Promise<string> {
  const output = await runYtDlp(['--get-title', '--no-playlist', videoUrl])
  return output.trim()
}
