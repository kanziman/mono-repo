import { describe, it, expect } from 'vitest'
import { chunkSegments, buildTranslationPrompt, buildSentenceTranslationPrompt, normalizeSpeaker, parseSpeakerResponse } from '@/lib/translate'
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

describe('chunkSegments (CHUNK_SIZE=30)', () => {
  it('90개 세그먼트를 30/30/30 3청크로 분할한다', () => {
    const chunks = chunkSegments(makeSegments(90))
    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toHaveLength(30)
    expect(chunks[1]).toHaveLength(30)
    expect(chunks[2]).toHaveLength(30)
  })

  it('20개 세그먼트를 1청크로 반환한다', () => {
    const chunks = chunkSegments(makeSegments(20))
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toHaveLength(20)
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

describe('buildSentenceTranslationPrompt', () => {
  it('JSON array 형식 지시가 포함된다', () => {
    const prompt = buildSentenceTranslationPrompt(makeSegments(2))
    expect(prompt.toLowerCase()).toContain('json')
    expect(prompt).toContain('translation')
    expect(prompt).toContain('speaker')
  })

  it('모든 segment text가 번호 목록으로 포함된다', () => {
    const prompt = buildSentenceTranslationPrompt(makeSegments(3))
    expect(prompt).toContain('Sentence 1')
    expect(prompt).toContain('Sentence 2')
    expect(prompt).toContain('Sentence 3')
  })
})

describe('normalizeSpeaker', () => {
  it('알려진 화자명은 그대로 반환한다', () => {
    expect(normalizeSpeaker('Angela')).toBe('Angela')
    expect(normalizeSpeaker('Steven')).toBe('Steven')
    expect(normalizeSpeaker('Unknown')).toBe('Unknown')
  })

  it('모르는 화자명은 Unknown으로 반환한다', () => {
    expect(normalizeSpeaker('President Biden')).toBe('Unknown')
    expect(normalizeSpeaker('')).toBe('Unknown')
  })

  it('guestName 힌트가 있으면 부분 일치도 인정한다', () => {
    expect(normalizeSpeaker('Luis', 'Luis')).toBe('Luis')
    expect(normalizeSpeaker('Luis von Ahn', 'Luis')).toBe('Luis')
  })
})

describe('parseSpeakerResponse', () => {
  it('정상 응답을 파싱한다', () => {
    const json = '[{"translation":"안녕","speaker":"Angela"},{"translation":"반가워","speaker":"Steven"}]'
    const result = parseSpeakerResponse(json, 2)
    expect(result[0]).toEqual({ translation: '안녕', speaker: 'Angela' })
    expect(result[1]).toEqual({ translation: '반가워', speaker: 'Steven' })
  })

  it('배열이 짧으면 Unknown으로 채운다', () => {
    const json = '[{"translation":"안녕","speaker":"Angela"}]'
    const result = parseSpeakerResponse(json, 3)
    expect(result).toHaveLength(3)
    expect(result[1]).toEqual({ translation: '', speaker: 'Unknown' })
    expect(result[2]).toEqual({ translation: '', speaker: 'Unknown' })
  })

  it('JSON 파싱 실패 시 전부 Unknown 빈값으로 채운다', () => {
    const result = parseSpeakerResponse('not json', 2)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ translation: '', speaker: 'Unknown' })
  })
})
