import { describe, it, expect } from 'vitest'
import { validateVideoId } from '@/lib/validate'

describe('/api/import validation', () => {
  it('유효한 videoId 형식을 통과시킨다', () => {
    expect(validateVideoId('dQw4w9WgXcQ')).toBe(true)
    expect(validateVideoId('abc_DEF-123')).toBe(true)
  })

  it('유효하지 않은 videoId 형식을 거부한다', () => {
    expect(validateVideoId('../../../etc')).toBe(false)
    expect(validateVideoId('tooshort')).toBe(false)
    expect(validateVideoId('toolongvalue!!')).toBe(false)
  })
})
