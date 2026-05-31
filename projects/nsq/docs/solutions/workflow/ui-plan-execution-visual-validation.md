# UI 계획 실행 실패 사후 분석 및 시각 검증 가이드

Date: 2026-05-30  
Scope: nsq-shadowing-plan (Task 12–17 UI 구현 구간)

---

## 현상

| 페이지 | 기대 | 실제 |
|--------|------|------|
| 홈 (`/`) | 다크 배경, 디자인 시스템 카드 그리드 | 화이트 배경, 경계 없는 평범한 레이아웃 |
| 플레이어 (`/player`) | 하이라이트 카드 목록 + 우측 튜터 패널 | 1406줄 단순 텍스트 나열 |

---

## 근본 원인 5가지

### 1. 라이트 모드에서 디자인 시스템 토큰이 자기파괴적

`defaultTheme="dark"` 설정이 있어도 next-themes는 **클라이언트 마운트 이후** 에야 `dark` 클래스를 `<html>`에 붙인다. 그 전까지 라이트 모드가 적용된다.

라이트 모드 토큰 값:
- `--semantic-background-normal-normal = #FFFFFF` (흰색)
- `--semantic-background-elevated-normal = #FFFFFF` (흰색)
- 세그먼트 카드의 `border-transparent` → **흰 배경 위 투명 테두리 = 카드가 보이지 않음**

토큰이 기술적으로 적용됐어도 라이트 모드에서는 시각적으로 "아무것도 없는" 것처럼 보인다.

### 2. 플랜 전체에 UI 시각 검증 단계 부재

`nsq-shadowing-plan.md`의 Task 12–17은 각 태스크의 "검증 절차"가 `vitest run` 뿐이었다. 브라우저에서 렌더링을 확인하는 체크리스트 항목이 **Task 18 이전에 단 하나도 없었다**.

### 3. smoke-test는 HTTP 200만 확인 — 시각 품질 미검증

`feedback-loop-layers-plan.md`에서 추가한 스모크 테스트 게이트는 `curl HTTP_STATUS = 200`이면 통과한다. 화면이 빈 흰 페이지여도, 카드가 투명해도 통과한다.

> **기술적 동작 ≠ 시각적 품질**

### 4. VTT 세그먼트 중복 제거 불완전

플레이어 화면에 `61 / 1406` 표시. 팟캐스트 한 에피소드에 1406 세그먼트는 VTT 롤링 자막(3~5단어씩 밀리는 방식)이 완전히 제거되지 않은 결과다. 세그먼트 경계가 "문장 단위"가 아니어서 UI 레이아웃이 파괴된다.

### 5. 에이전트가 계획 → 커밋을 브라우저 없이 실행

서브에이전트는 `vitest` 통과 = 완료로 처리하고 브라우저를 열어 실제 렌더링을 확인하지 않았다. 자동화된 논리 검증과 사람이 봐야 하는 시각 검증은 동치가 아니다.

---

## 재발 방지 계획

### A. 플랜 작성 단계 (`zb-writing-plans` 정책)

**UI 태스크마다 시각 검증 체크리스트 필수화**:

각 UI 태스크(홈 페이지, 플레이어 페이지, 컴포넌트 등)의 "검증 절차" 섹션에 아래 항목을 반드시 포함한다:

```markdown
**시각 검증** (UI 컴포넌트 태스크 필수):
- [ ] `npm run dev` 후 브라우저에서 해당 페이지 직접 확인
- [ ] 다크 테마 적용 여부 확인 (배경색이 어두운가?)
- [ ] 디자인 시스템 컴포넌트 렌더링 확인 (Card, Button, Badge 등 실제로 보이는가?)
- [ ] 예상 레이아웃과 일치 여부 확인
```

**"이 태스크 후 보여야 할 모습" 묘사 추가**:

```markdown
**기대 렌더링**:
- 다크 배경 (#1B1C1E 계열)
- 에피소드 카드: 썸네일 + 제목 + 날짜, 호버 시 약간 밝아짐
- Import 버튼: 파란색 solid 버튼
```

### B. smoke-test.sh 강화

```bash
# 기존: HTTP 200만 확인
# 추가: dark 클래스 존재 여부 확인
HTML=$(curl -s "http://localhost:$PORT")

if echo "$HTML" | grep -q 'class="dark"'; then
  echo "[smoke] dark class: OK"
else
  echo "[smoke] WARN: dark class missing — check ThemeProvider / defaultTheme"
fi
```

### C. `zb-finish-branch` 스킬 시각 검증 게이트

기존 smoke-test 단계(2-a) 다음에 추가:

```
2-b. [ ] 시각 검증 (UI 컴포넌트를 포함한 프로젝트):
   - 브라우저에서 핵심 페이지 스크린샷을 캡처하거나 사용자에게 확인 요청
   - 다크/라이트 모드 전환 후 레이아웃 깨짐 없는지 확인
   - 에이전트가 직접 브라우저를 열 수 없을 경우: 사용자에게 "지금 이 페이지들을 확인해 주세요" 요청 후 진행
```

### D. VTT 파싱 기준 강화

세그먼트 중복 제거 기준을 강화하고, 플랜에 "예상 세그먼트 수 범위" 검증 항목을 명시한다:

```typescript
// 기존: text 완전 일치 시 중복 제거
// 개선: text 포함관계 OR 최소 길이 필터 추가
function deduplicateSegments(segments: Segment[]): Segment[] {
  return segments
    .filter(seg => seg.text.trim().split(' ').length >= 5) // 5단어 미만 제거
    .filter((seg, i, arr) => {
      if (i === 0) return true
      const prev = arr[i - 1]
      // 이전 세그먼트가 현재 세그먼트를 포함하거나, 동일하면 제거
      return !prev.text.includes(seg.text) && prev.text !== seg.text
    })
}
```

플랜 검증 항목:

```markdown
**세그먼트 수 범위 검증**:
- [ ] 30분 에피소드 기준 예상 세그먼트 수: 150–400개
- [ ] 1000개 초과 시 VTT 파싱 로직 재검토
```

### E. 다크 모드 독립 검증 루트 (개발 전용)

`/dev/tokens` 페이지(개발 환경 전용)를 추가해 모든 시맨틱 토큰을 색상 스와치로 렌더링:

```tsx
// src/app/dev/tokens/page.tsx (process.env.NODE_ENV === 'development' 에서만 접근)
const tokens = [
  { name: 'background-normal-normal', class: 'bg-background-normal-normal' },
  { name: 'background-elevated-normal', class: 'bg-background-elevated-normal' },
  { name: 'label-normal', class: 'text-label-normal bg-background-normal-normal' },
  // ...
]
```

이 페이지를 보면 "토큰이 실제로 어떤 색으로 보이는가"를 즉시 확인할 수 있다.

---

## 핵심 교훈

> **계획이 기술 정확성(테스트 통과)에만 집중하고, 시각 품질 검증을 마지막 태스크 하나로 미뤘기 때문에, 에이전트 실행 루프에서 UI 품질 피드백이 전혀 없었다.**

UI 태스크는 다음 두 가지를 모두 검증해야 한다:
1. **논리 검증**: `vitest` — 로직과 타입이 맞는가
2. **시각 검증**: 브라우저 확인 — 실제로 의도한 대로 보이는가

이 두 가지는 서로 대체 불가능하다.
