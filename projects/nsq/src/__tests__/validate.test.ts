import { describe, it, expect } from 'vitest'
import { validateVideoId, getEpisodePath, getFilePath } from '@/lib/validate'

describe('validateVideoId', () => {
  it('유효한 11자 alphanumeric ID를 수락한다', () => {
    expect(validateVideoId('dQw4w9WgXcQ')).toBe(true)
    expect(validateVideoId('abc_DEF-123')).toBe(true)
    expect(validateVideoId('12345678901')).toBe(true)
  })

  it('../ 경로 주입을 거부한다', () => {
    expect(validateVideoId('../../../etc')).toBe(false)
    expect(validateVideoId('...........')).toBe(false)
  })

  it('11자 미만을 거부한다', () => {
    expect(validateVideoId('short')).toBe(false)
    expect(validateVideoId('1234567890')).toBe(false)
  })

  it('11자 초과를 거부한다', () => {
    expect(validateVideoId('dQw4w9WgXcQQ')).toBe(false)
    expect(validateVideoId('123456789012')).toBe(false)
  })

  it('특수문자를 거부한다', () => {
    expect(validateVideoId('dQw4w9WgX!!')).toBe(false)
    expect(validateVideoId('dQw4w9WgX !')).toBe(false)
  })
})

describe('getEpisodePath', () => {
  it('유효한 videoId로 정상 경로를 반환한다', () => {
    const result = getEpisodePath('dQw4w9WgXcQ')
    expect(result).toContain('dQw4w9WgXcQ')
    expect(result).toContain('.shadowing')
  })

  it('잘못된 videoId에서 Error를 throw한다', () => {
    expect(() => getEpisodePath('../../../etc')).toThrow()
    expect(() => getEpisodePath('tooshort')).toThrow()
  })
})

describe('getFilePath', () => {
  it('videoId와 filename을 결합한 경로를 반환한다', () => {
    const result = getFilePath('dQw4w9WgXcQ', 'audio.mp3')
    expect(result).toContain('dQw4w9WgXcQ')
    expect(result).toContain('audio.mp3')
  })
})
