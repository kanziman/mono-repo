---
title: "VTT sliding-window overlap(gap < 0)을 문장 병합 조건으로 처리하는 패턴"
date: 2026-06-01
tags: [vtt, subtitle, gap, overlap, segmentation]
problem_type: architecture
---

# 문제

YouTube auto-sub VTT는 sliding window 방식으로 생성돼 인접 cue 간 타임스탬프가 겹치는 경우가 존재한다.
`seg.start - current.end`를 gap으로 계산하면 음수가 나오는 케이스가 있다.

재현 조건:
```
00:00:01.000 --> 00:00:03.000
Overlapping start

00:00:02.500 --> 00:00:04.500
end of phrase.
```
위에서 gap = 2.5 - 3.0 = **-0.5s** (음수)

# 실패한 시도

- `gap >= 0`을 병합 조건으로 추가: VTT overlap(gap=-0.5) 케이스가 `gap >= gapThreshold(1.5)` 조건을 만족하지 않아 우연히 병합되긴 하지만, 로직이 의도를 드러내지 않음
- `Math.abs(gap) >= gapThreshold`로 처리: 절댓값 계산 시 -0.5도 양수 0.5로 변환되어 gap 기준 분리가 의도치 않게 작동할 수 있음

# 해결책

gap을 그냥 계산하고, split 조건에서 `gap >= gapThreshold`만 검사한다.
gap < 0이면 어떤 split 조건도 만족하지 않으므로 자동으로 merge 경로(`else` 브랜치)를 탄다.

```typescript
const gap = seg.start - current.end  // gap < 0 = VTT overlap → keep merging

if (gap >= gapThreshold || endsPunct || tooLong) {
  // split: new sentence
  sentences.push(current)
  current = { start: seg.start, end: seg.end, text: seg.text, translation: '' }
} else {
  // merge: extend current sentence
  current = { ...current, end: seg.end, text: current.text + ' ' + seg.text }
}
```

# 원인 분석

YouTube VTT sliding window는 자막 표시의 연속성을 위해 이전 cue 종료 전에 다음 cue를 시작시킨다.
이 overlap은 시청자가 자막 깜빡임을 느끼지 않게 하기 위한 것이며, 발화 전환과는 무관하다.
따라서 gap < 0인 경우는 항상 "같은 발화가 계속되는 중"으로 해석하는 것이 올바르다.

# 재발 방지

- `vttToSentences()`에서 gap 계산 시 Math.abs() 사용 금지
- gap < 0 케이스에 대한 테스트 케이스 유지 (`vtt.test.ts`의 `gap이 음수(VTT overlap)이면 병합 계속한다` 테스트)
- VTT cue 처리 로직 수정 시 이 테스트 케이스가 통과하는지 반드시 확인
