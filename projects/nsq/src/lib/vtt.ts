import type { Segment } from '@/types'

// HH:MM:SS.mmm or MM:SS.mmm → seconds
function parseTimestamp(ts: string): number {
  const parts = ts.split(':')
  if (parts.length === 3) {
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2])
  }
  return parseInt(parts[0], 10) * 60 + parseFloat(parts[1])
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

  // Deduplicate rolling-window VTT subtitles.
  // YouTube auto-subs produce a 2-line sliding window, e.g.:
  //   ["A B C D", "A B C D E F", "D E F", "D E F G H I", ...]
  // Two passes:
  //   1. Containment: if prev contains curr → skip; if curr contains prev → replace prev
  //   2. Suffix-prefix: if last ≥4 words of prev == first ≥4 words of curr → skip curr
  function normalize(t: string): string {
    return t.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
  }

  function suffixPrefixOverlap(prevWords: string[], currWords: string[], minOverlap = 4): boolean {
    const max = Math.min(prevWords.length, currWords.length)
    for (let n = max; n >= minOverlap; n--) {
      if (prevWords.slice(-n).join(' ') === currWords.slice(0, n).join(' ')) return true
    }
    return false
  }

  const deduped: Segment[] = []
  for (const seg of raw) {
    if (deduped.length === 0) {
      deduped.push(seg)
      continue
    }
    const prev = deduped[deduped.length - 1]
    const pn = normalize(prev.text)
    const cn = normalize(seg.text)

    if (pn === cn) continue
    if (pn.includes(cn)) continue
    if (cn.includes(pn)) { deduped[deduped.length - 1] = seg; continue }
    if (suffixPrefixOverlap(pn.split(' '), cn.split(' '))) continue

    deduped.push(seg)
  }

  return deduped.map((seg, idx) => ({ ...seg, index: idx }))
}
