import { describe, it, expect } from 'vitest'
import { extractVideoId } from '@/lib/youtube'

describe('extractVideoId', () => {
  it('standard watch URL에서 videoId 추출', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('youtu.be 단축 URL에서 videoId 추출', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('쿼리스트링이 추가된 URL에서 videoId 추출', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ')
  })

  it('잘못된 URL은 null 반환', () => {
    expect(extractVideoId('https://example.com')).toBeNull()
    expect(extractVideoId('')).toBeNull()
    expect(extractVideoId('not a url')).toBeNull()
  })
})
