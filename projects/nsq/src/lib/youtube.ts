export function extractVideoId(url: string): string | null {
  const pattern = /(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = url.match(pattern)
  return match ? match[1] : null
}
