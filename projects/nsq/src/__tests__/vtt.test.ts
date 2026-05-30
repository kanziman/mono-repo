import { describe, it, expect } from 'vitest'
import { vttToSegments } from '@/lib/vtt'

const SAMPLE_VTT = `WEBVTT

00:00:01.000 --> 00:00:03.000
Hello, <c.colorCCCCCC>world</c>!

00:00:04.000 --> 00:00:06.000
This is &amp; a &lt;test&gt; &quot;string&quot; &#39;here&#39;

00:00:07.000 --> 00:00:09.000
Duplicate line

00:00:10.000 --> 00:00:12.000
Duplicate line

00:00:13.000 --> 00:00:15.000
Final segment
`

describe('vttToSegments', () => {
  it('타임스탬프를 seconds로 정확히 변환한다', () => {
    const segments = vttToSegments(SAMPLE_VTT)
    expect(segments[0].start).toBe(1)
    expect(segments[0].end).toBe(3)
    expect(segments[1].start).toBe(4)
    expect(segments[1].end).toBe(6)
  })

  it('HTML 태그를 제거한다', () => {
    const segments = vttToSegments(SAMPLE_VTT)
    expect(segments[0].text).toBe('Hello, world!')
    expect(segments[0].text).not.toContain('<')
  })

  it('HTML 엔티티를 디코딩한다', () => {
    const segments = vttToSegments(SAMPLE_VTT)
    expect(segments[1].text).toContain('&')
    expect(segments[1].text).toContain('<test>')
    expect(segments[1].text).toContain('"string"')
    expect(segments[1].text).toContain("'here'")
  })

  it('연속 중복 세그먼트를 1개로 합친다', () => {
    const segments = vttToSegments(SAMPLE_VTT)
    const duplicates = segments.filter((s) => s.text === 'Duplicate line')
    expect(duplicates).toHaveLength(1)
  })

  it('index를 0부터 순차적으로 부여한다', () => {
    const segments = vttToSegments(SAMPLE_VTT)
    segments.forEach((seg, i) => expect(seg.index).toBe(i))
  })

  it('translation을 빈 문자열로 초기화한다', () => {
    const segments = vttToSegments(SAMPLE_VTT)
    segments.forEach((seg) => expect(seg.translation).toBe(''))
  })
})
