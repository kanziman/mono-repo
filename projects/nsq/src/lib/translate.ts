import fs from 'fs'
import path from 'path'
import type { Segment } from '@/types'

const CHUNK_SIZE = 50
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

async function callOpenRouter(prompt: string): Promise<string[]> {
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
  const content = data.choices[0].message.content.trim()
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON array in translation response')
  return JSON.parse(jsonMatch[0]) as string[]
}

export async function translateChunk(
  segments: Segment[],
  chunkIndex: number,
  checkpointDir: string
): Promise<string[]> {
  const checkpointPath = path.join(checkpointDir, `translate_chunk_${chunkIndex}.json`)

  if (fs.existsSync(checkpointPath)) {
    return JSON.parse(fs.readFileSync(checkpointPath, 'utf-8')) as string[]
  }

  const prompt = buildTranslationPrompt(segments)
  let translations: string[]

  try {
    translations = await callOpenRouter(prompt)
  } catch {
    // 1 retry
    try {
      translations = await callOpenRouter(prompt)
    } catch {
      translations = Array(segments.length).fill('')
    }
  }

  // Normalize length
  if (translations.length < segments.length) {
    translations = [...translations, ...Array(segments.length - translations.length).fill('')]
  } else if (translations.length > segments.length) {
    translations = translations.slice(0, segments.length)
  }

  fs.writeFileSync(checkpointPath, JSON.stringify(translations), 'utf-8')
  return translations
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
    const translations = await translateChunk(chunks[i], i, checkpointDir)
    const offset = i * CHUNK_SIZE
    translations.forEach((t, j) => {
      result[offset + j] = { ...result[offset + j], translation: t }
    })
    done += chunks[i].length
    onProgress?.(done, segments.length)
  }

  // Clean up checkpoints
  for (let i = 0; i < chunks.length; i++) {
    const p = path.join(checkpointDir, `translate_chunk_${i}.json`)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  }

  return result
}
