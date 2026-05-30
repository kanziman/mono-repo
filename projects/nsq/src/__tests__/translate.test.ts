import { describe, it, expect } from 'vitest'
import { chunkSegments, buildTranslationPrompt } from '@/lib/translate'
import type { Segment } from '@/types'

function makeSegments(count: number): Segment[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    start: i,
    end: i + 1,
    text: `Sentence ${i + 1}`,
    translation: '',
  }))
}

describe('chunkSegments', () => {
  it('120개 세그먼트를 50/50/20 3청크로 분할한다', () => {
    const chunks = chunkSegments(makeSegments(120))
    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toHaveLength(50)
    expect(chunks[1]).toHaveLength(50)
    expect(chunks[2]).toHaveLength(20)
  })

  it('30개 세그먼트를 1청크로 반환한다', () => {
    const chunks = chunkSegments(makeSegments(30))
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toHaveLength(30)
  })
})

describe('buildTranslationPrompt', () => {
  it('모든 segment text가 포함된다', () => {
    const segments = makeSegments(3)
    const prompt = buildTranslationPrompt(segments)
    expect(prompt).toContain('Sentence 1')
    expect(prompt).toContain('Sentence 2')
    expect(prompt).toContain('Sentence 3')
  })

  it('"json" 키워드가 포함된다', () => {
    const segments = makeSegments(2)
    const prompt = buildTranslationPrompt(segments)
    expect(prompt.toLowerCase()).toContain('json')
  })
})
