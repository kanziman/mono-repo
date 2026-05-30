export function parseRangeHeader(
  range: string | null,
  fileSize: number
): { start: number; end: number } | null {
  if (range === null) return null

  const match = /^bytes=(\d+)-(\d*)$/.exec(range)
  if (!match) return null

  const start = parseInt(match[1], 10)
  const end = match[2] === '' ? fileSize - 1 : Math.min(parseInt(match[2], 10), fileSize - 1)

  return { start, end }
}
