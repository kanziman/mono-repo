export const runtime = 'nodejs'

import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { validateVideoId } from '@/lib/validate'
import { EPISODES_BASE } from '@/lib/paths'
import { parseRangeHeader } from '@/lib/audio'

function nodeStreamToWeb(nodeStream: import('fs').ReadStream): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => controller.enqueue(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      nodeStream.on('end', () => controller.close())
      nodeStream.on('error', (err) => controller.error(err))
    },
    cancel() { nodeStream.destroy() },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params

  if (!validateVideoId(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId' }, { status: 400 })
  }

  const audioPath = path.join(EPISODES_BASE, videoId, 'audio.m4a')

  if (!fs.existsSync(audioPath)) {
    return NextResponse.json({ error: 'Audio not found' }, { status: 404 })
  }

  const fileSize = fs.statSync(audioPath).size
  const rangeHeader = request.headers.get('Range')
  const range = parseRangeHeader(rangeHeader, fileSize)

  if (range !== null) {
    const { start, end } = range
    const nodeStream = fs.createReadStream(audioPath, { start, end })
    const webStream = nodeStreamToWeb(nodeStream)

    return new Response(webStream, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(end - start + 1),
        'Content-Type': 'audio/mp4',
      },
    })
  }

  const nodeStream = fs.createReadStream(audioPath)
  const webStream = nodeStreamToWeb(nodeStream)

  return new Response(webStream, {
    status: 200,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Length': String(fileSize),
      'Content-Type': 'audio/mp4',
    },
  })
}
