import type { Segment } from '@/types'

// HH:MM:SS.mmm or MM:SS.mmm → seconds
function parseTimestamp(ts: string): number {
  const parts = ts.split(':')
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2])
  }
  return parseInt(parts[0]) * 60 + parseFloat(parts[1])
}

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, '')
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

const TIMESTAMP_RE = /^(\d{1,2}:\d{2}:\d{2}\.\d+|\d{1,2}:\d{2}\.\d+)\s+-->\s+(\d{1,2}:\d{2}:\d{2}\.\d+|\d{1,2}:\d{2}\.\d+)/

export function vttToSegments(vtt: string): Segment[] {
  const lines = vtt.split('\n')
  const raw: Segment[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    const match = line.match(TIMESTAMP_RE)
    if (match) {
      const start = parseTimestamp(match[1])
      const end = parseTimestamp(match[2])
      i++
      const textLines: string[] = []
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i].trim())
        i++
      }
      const text = decodeHtmlEntities(stripHtmlTags(textLines.join(' '))).trim()
      if (text) {
        raw.push({ index: 0, start, end, text, translation: '' })
      }
    } else {
      i++
    }
  }

  // Remove consecutive duplicate text segments
  const deduped: Segment[] = []
  for (const seg of raw) {
    if (deduped.length === 0 || deduped[deduped.length - 1].text !== seg.text) {
      deduped.push(seg)
    }
  }

  return deduped.map((seg, idx) => ({ ...seg, index: idx }))
}
