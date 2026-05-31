import { describe, it, expect } from 'vitest'
import { parseYtDlpProgress } from '@/lib/ytdlp'

describe('parseYtDlpProgress', () => {
  it('[download] XX.X% 형식에서 숫자 파싱', () => {
    expect(parseYtDlpProgress('[download]  50.3% of ~10.00MiB at 2.50MiB/s ETA 00:02')).toBe(50.3)
    expect(parseYtDlpProgress('[download] 100% of ~10.00MiB at 3.20MiB/s ETA 00:00')).toBe(100)
    expect(parseYtDlpProgress('[download]   0.1% of ~10.00MiB')).toBe(0.1)
  })

  it('관련 없는 라인은 null 반환', () => {
    expect(parseYtDlpProgress('[info] Writing subtitle to: subtitle.en.vtt')).toBeNull()
    expect(parseYtDlpProgress('')).toBeNull()
    expect(parseYtDlpProgress('some random line')).toBeNull()
  })
})
