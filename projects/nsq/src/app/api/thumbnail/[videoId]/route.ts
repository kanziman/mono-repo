import fs from 'fs'
import { validateVideoId, getFilePath } from '@/lib/validate'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params

  if (!validateVideoId(videoId)) {
    return new Response('Invalid videoId', { status: 400 })
  }

  let filePath: string
  try {
    filePath = getFilePath(videoId, 'thumbnail.jpg')
  } catch {
    return new Response('Invalid videoId', { status: 400 })
  }

  if (!fs.existsSync(filePath)) {
    return new Response('Not found', { status: 404 })
  }

  const buffer = fs.readFileSync(filePath)
  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/jpeg',
    },
  })
}
