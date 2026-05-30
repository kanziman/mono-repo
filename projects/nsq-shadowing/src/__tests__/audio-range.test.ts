import { describe, it, expect } from 'vitest'
import { parseRangeHeader } from '@/lib/audio'

describe('parseRangeHeader', () => {
  it('bytes=0-999 파싱', () => { expect(parseRangeHeader('bytes=0-999', 5000)).toEqual({ start: 0, end: 999 }) })
  it('bytes=500- open-ended 파싱', () => { expect(parseRangeHeader('bytes=500-', 1000)).toEqual({ start: 500, end: 999 }) })
  it('null 입력 → null 반환', () => { expect(parseRangeHeader(null, 1000)).toBeNull() })
  it('end clamp: fileSize-1 초과 시 clamping', () => { expect(parseRangeHeader('bytes=0-9999', 1000)).toEqual({ start: 0, end: 999 }) })
})
