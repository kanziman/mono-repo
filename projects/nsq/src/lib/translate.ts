import fs from 'fs'
import path from 'path'
import type { Segment } from '@/types'

const CHUNK_SIZE = 30
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export function chunkSegments(segments: Segment[], size = CHUNK_SIZE): Segment[][] {
  const chunks: Segment[][] = []
  for (let i = 0; i < segments.length; i += size) {
    chunks.push(segments.slice(i, i + size))
  }
  return chunks
}

export function buildTranslationPrompt(segments: Segment[]): string {
  const lines = segments.map((s, i) => `${i + 1}. ${s.text}`).join('\n')
  return (
    `다음 영어 문장들을 자연스러운 한국어로 번역하세요.\n` +
    `반드시 JSON 배열 형식으로만 응답하세요. 예: ["번역1", "번역2"]\n` +
    `설명이나 추가 텍스트 없이 JSON 배열만 출력하세요.\n\n` +
    lines
  )
}

export function buildSentenceTranslationPrompt(segments: Segment[]): string {
  const lines = segments.map((s, i) => `${i + 1}. ${s.text}`).join('\n')
  return (
    `This is a transcript from "No Stupid Questions" podcast.\n` +
    `Two regular hosts (Angela Duckworth, Steven Dubner) plus one guest per episode.\n` +
    `Identify the speaker for each line using context clues (self-introductions, name mentions).\n` +
    `Use the actual name when identifiable; use "Unknown" otherwise.\n\n` +
    `Translate each line to Korean.\n` +
    `Output JSON array ONLY — no explanation:\n` +
    `[{"translation":"한국어","speaker":"Angela"}, ...]\n\n` +
    lines
  )
}

const KNOWN_SPEAKERS = new Set(['Angela', 'Steven', 'Unknown'])

export function normalizeSpeaker(raw: string, guestName?: string): string {
  if (KNOWN_SPEAKERS.has(raw)) return raw
  if (guestName && raw.toLowerCase().includes(guestName.toLowerCase())) return guestName
  return 'Unknown'
}

export type SpeakerTranslation = { translation: string; speaker: string }

export function parseSpeakerResponse(content: string, count: number): SpeakerTranslation[] {
  const empty = (): SpeakerTranslation => ({ translation: '', speaker: 'Unknown' })
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return Array(count).fill(null).map(empty)
    const parsed = JSON.parse(jsonMatch[0]) as SpeakerTranslation[]
    const result = parsed.slice(0, count)
    while (result.length < count) result.push(empty())
    return result
  } catch {
    return Array(count).fill(null).map(empty)
  }
}

async function callOpenRouterRaw(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY environment variable is not set')
  const model = process.env.TRANSLATION_MODEL ?? 'google/gemini-flash-1.5'
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenRouter API error: ${res.status} ${body}`)
  }
  const data = await res.json() as { choices: { message: { content: string } }[] }
  return data.choices[0].message.content.trim()
}

export async function translateChunk(
  segments: Segment[],
  chunkIndex: number,
  checkpointDir: string
): Promise<SpeakerTranslation[]> {
  const checkpointPath = path.join(checkpointDir, `translate_chunk_${chunkIndex}.json`)

  if (fs.existsSync(checkpointPath)) {
    return JSON.parse(fs.readFileSync(checkpointPath, 'utf-8')) as SpeakerTranslation[]
  }

  const prompt = buildSentenceTranslationPrompt(segments)
  let items: SpeakerTranslation[]

  try {
    const content = await callOpenRouterRaw(prompt)
    items = parseSpeakerResponse(content, segments.length)
  } catch {
    try {
      const content = await callOpenRouterRaw(prompt)
      items = parseSpeakerResponse(content, segments.length)
    } catch {
      items = Array(segments.length).fill(null).map(() => ({ translation: '', speaker: 'Unknown' }))
    }
  }

  fs.writeFileSync(checkpointPath, JSON.stringify(items), 'utf-8')
  return items
}

export async function translateAllSegments(
  segments: Segment[],
  checkpointDir: string,
  onProgress?: (done: number, total: number) => void
): Promise<Segment[]> {
  const chunks = chunkSegments(segments)
  const result: Segment[] = [...segments]
  let done = 0

  for (let i = 0; i < chunks.length; i++) {
    const items = await translateChunk(chunks[i], i, checkpointDir)
    const offset = i * CHUNK_SIZE
    items.forEach((item, j) => {
      result[offset + j] = {
        ...result[offset + j],
        translation: item.translation,
        speaker: item.speaker,
      }
    })
    done += chunks[i].length
    onProgress?.(done, segments.length)
  }

  for (let i = 0; i < chunks.length; i++) {
    const p = path.join(checkpointDir, `translate_chunk_${i}.json`)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  }

  return result
}
