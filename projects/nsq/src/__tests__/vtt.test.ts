import { describe, it, expect } from 'vitest'
import { vttToSegments, vttToSentences } from '@/lib/vtt'

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

  it('포함 관계인 연속 세그먼트를 제거한다 (롤링 윈도우 VTT)', () => {
    const rolling = `WEBVTT

00:00:01.000 --> 00:00:02.000
Hello how are you

00:00:02.000 --> 00:00:04.000
Hello how are you doing today

00:00:04.000 --> 00:00:06.000
doing today

00:00:06.000 --> 00:00:08.000
doing today nice to meet you
`
    const segments = vttToSegments(rolling)
    // "Hello how are you" 는 "Hello how are you doing today"에 포함 → 교체됨
    // "doing today"는 "Hello how are you doing today"에 포함 → 제거됨
    // "doing today nice to meet you"는 포함관계 없음 → 유지됨
    expect(segments).toHaveLength(2)
    expect(segments[0].text).toBe('Hello how are you doing today')
    expect(segments[1].text).toBe('doing today nice to meet you')
  })
})

describe('vttToSentences', () => {
  const makeVtt = (cues: { start: string; end: string; text: string }[]) =>
    'WEBVTT\n\n' +
    cues.map(({ start, end, text }) => `${start} --> ${end}\n${text}`).join('\n\n')

  it('1.5s 이상 gap이 있으면 새 문장으로 분리한다', () => {
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:02.000', text: 'Hello world.' },
      { start: '00:00:05.000', end: '00:00:07.000', text: 'New sentence here.' },
    ])
    const sentences = vttToSentences(vtt, 1.5)
    expect(sentences).toHaveLength(2)
    expect(sentences[0].text).toBe('Hello world.')
    expect(sentences[1].text).toBe('New sentence here.')
  })

  it('gap < 1.5s이면 하나의 문장으로 병합한다', () => {
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:02.000', text: 'Hello' },
      { start: '00:00:02.500', end: '00:00:04.000', text: 'world.' },
    ])
    const sentences = vttToSentences(vtt, 1.5)
    expect(sentences).toHaveLength(1)
    expect(sentences[0].text).toBe('Hello world.')
    expect(sentences[0].start).toBe(1)
    expect(sentences[0].end).toBe(4)
  })

  it('구두점(. ? !)으로 끝나면 새 문장으로 분리한다', () => {
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:02.000', text: 'Is this a question?' },
      { start: '00:00:02.500', end: '00:00:04.000', text: 'Yes it is.' },
    ])
    const sentences = vttToSentences(vtt, 1.5)
    expect(sentences).toHaveLength(2)
  })

  it('gap이 음수(VTT overlap)이면 병합 계속한다', () => {
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:03.000', text: 'Overlapping start' },
      { start: '00:00:02.500', end: '00:00:04.500', text: 'end of phrase.' },
    ])
    const sentences = vttToSentences(vtt, 1.5)
    expect(sentences).toHaveLength(1)
    expect(sentences[0].text).toBe('Overlapping start end of phrase.')
  })

  it('50단어 초과 시 새 문장으로 분리한다', () => {
    const longText = Array(51).fill('word').join(' ')
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:02.000', text: longText },
      { start: '00:00:02.500', end: '00:00:04.000', text: 'Next sentence.' },
    ])
    const sentences = vttToSentences(vtt, 1.5)
    expect(sentences.length).toBeGreaterThanOrEqual(2)
  })

  it('translation은 빈 문자열로 초기화한다', () => {
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:03.000', text: 'Test sentence.' },
    ])
    const sentences = vttToSentences(vtt)
    expect(sentences[0].translation).toBe('')
  })

  it('index를 0부터 순차 부여한다', () => {
    const vtt = makeVtt([
      { start: '00:00:01.000', end: '00:00:02.000', text: 'First.' },
      { start: '00:00:05.000', end: '00:00:07.000', text: 'Second.' },
    ])
    const sentences = vttToSentences(vtt)
    expect(sentences[0].index).toBe(0)
    expect(sentences[1].index).toBe(1)
  })
})
