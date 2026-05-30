export const runtime = 'nodejs'

import fs from 'fs'
import path from 'path'
import { validateVideoId, getFilePath } from '@/lib/validate'
import { buildSystemPrompt } from '@/lib/tutor'
import type { Persona, Message, Segment, EpisodeMeta } from '@/types'

export async function POST(request: Request) {
  const body = await request.json() as {
    videoId: string
    persona: Persona
    messages: Message[]
    currentSegment?: Segment
  }

  const { videoId, persona, messages, currentSegment } = body

  if (!videoId || !validateVideoId(videoId)) {
    return new Response('Invalid videoId', { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set')
  }

  let metaPath: string
  let segmentsPath: string
  try {
    metaPath = getFilePath(videoId, 'meta.json')
    segmentsPath = getFilePath(videoId, 'segments.json')
  } catch {
    return new Response('Invalid videoId', { status: 400 })
  }

  if (!fs.existsSync(metaPath) || !fs.existsSync(segmentsPath)) {
    return new Response('Episode not found', { status: 404 })
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as EpisodeMeta
  const allSegments = JSON.parse(fs.readFileSync(segmentsPath, 'utf-8')) as Segment[]

  const systemPrompt = buildSystemPrompt(persona, meta.title, allSegments, currentSegment)

  const model = process.env.TUTOR_MODEL ?? 'anthropic/claude-haiku-4-5'

  const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  })

  if (!openRouterRes.ok) {
    return new Response('Upstream error', { status: 500 })
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = openRouterRes.body!.getReader()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue

            const payload = trimmed.slice('data: '.length)

            if (payload === '[DONE]') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ delta: '', done: true })}\n\n`)
              )
              controller.close()
              return
            }

            try {
              const parsed = JSON.parse(payload)
              const content = parsed.choices?.[0]?.delta?.content
              if (typeof content === 'string') {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ delta: content })}\n\n`)
                )
              }
            } catch {
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
