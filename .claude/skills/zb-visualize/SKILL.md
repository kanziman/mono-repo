---
name: zb-visualize
description: UI 레이아웃, 와이어프레임, 컴포넌트 비교 등 시각적 설계 시안을 브라우저에서 검증할 때 사용합니다. 브라우저 기반 Visual Brainstorming Companion을 기동하고 HTML 시안을 작성하여 사용자 피드백을 수집합니다.
---

# zb-visualize

브라우저 기반 시각적 브레인스토밍 컴패니언(Visual Brainstorming Companion)을 사용하여 와이어프레임, 레이아웃 비교 및 시각적 피드백을 수집하는 워크플로우를 정의합니다.

## 📌 핵심 판단 기준

모든 질문마다 **"사용자가 텍스트보다 화면을 직접 보고 이해하는 것이 유리한가?"**를 기준으로 판단하십시오.

- **브라우저 사용 대상 (시각적 컨텐츠)**: UI 레이아웃, 와이어프레임, 컴포넌트 디자인, 색상 및 레이아웃 비교 시안
- **터미널 사용 대상 (개념적 컨텐츠)**: 기능 범위 정의, 정책 의사결정, pros/cons 설명 등 텍스트 중심 질문

---

## 🛠️ 핵심 체크리스트 (Checklist)

1. `[ ]` **서버 기동**: `$STATE_DIR/server-info`를 읽어 기존 서버 여부를 확인하고, 없으면 아래 명령으로 기동

   ```bash
   bash .claude/skills/zb-visualize/scripts/start-server.sh --project-dir $(pwd)
   ```

2. `[ ]` **HTML 시안 작성**: `screen_dir` 경로에 새 HTML 파일 작성 (`<body>` 내부 프래그먼트만 작성 — 프레임·CSS 테마는 서버가 자동 래핑)
   - 기존 파일명 재사용 금지 — 새 버전명 사용 (예: `layout-v2.html`)
3. `[ ]` **URL 공유 및 피드백 요청**: 사용자에게 URL을 제공하고 브라우저 클릭 또는 텍스트 피드백 요청
4. `[ ]` **피드백 확인**: `$STATE_DIR/events` (JSON lines)를 읽어 클릭 데이터 파악 후 설계에 반영

---

## 🔄 프로세스 흐름 (Process Flow)

```text
서버 기동 → HTML 시안 작성 → URL 공유 → 피드백 수집(events) → 설계 반영
                ↑                                                     |
                └─────────────── 피드백 루프 (시안 수정) ─────────────┘
```

---

## 📁 스니펫 라이브러리 (Snippets)

`snippets/` 폴더의 템플릿을 복사해 텍스트만 교체하면 됩니다. 직접 HTML을 처음부터 작성하지 마십시오 — 토큰 낭비입니다.

| 파일 | 사용 상황 |
| --- | --- |
| `option-ab.html` | A/B 2안 비교 + pros/cons |
| `option-abc.html` | A/B/C 3안 비교 + 배지/태그 |
| `split-mockup.html` | 좌/우 UI 레이아웃 나란히 비교 |
| `card-grid.html` | 카드 그리드 복수 선택 |

**작성 규칙**: 파일명은 반드시 새 버전으로 (예: `approaches-v2.html`) — 기존 파일명 재사용 시 브라우저 캐시로 반영 안 됨.

---

## 🎨 사용 가능한 CSS 클래스 (CSS Classes)

디자인 시스템(`@design-system/globals.css`) 토큰 기반.

> ⚠️ **CSS 변수(`var(--*)`)는 브레인스토밍 서버에서 작동하지 않는다.**
> 브레인스토밍 서버는 디자인 시스템 CSS를 자동 주입하지 않으므로 `var(--text)`, `var(--border)` 등을 쓰면 텍스트가 투명/불가시 상태로 보인다.
> **커스텀 `<style>` 블록에서는 반드시 하드코딩된 hex 값을 사용하라.**

### 다크 테마 기본 팔레트 (Slate Dark)

커스텀 스타일을 직접 작성할 때 복사해서 사용:

```text
텍스트   #f8fafc (heading)  #f1f5f9 (body)  #e2e8f0 (secondary)  #94a3b8 (muted)  #64748b (dimmed)
배경     #0f172a (darkest)  #1e293b (card)  #334155 (border)      #475569 (muted border)
강조     #3b82f6 (primary)  #60a5fa (light) #1d4ed8 (dark)        #1e3a5f (tinted bg)
```

### 레이아웃

- `.options` / `.option[data-choice]` — A/B/C 선택지 (`data-multiselect` 속성으로 복수 선택)
- `.cards` / `.card[data-choice]` — 카드 그리드
- `.split` — 좌우 2열 분할
- `.mockup` / `.mockup-header` / `.mockup-body` — UI 시안 컨테이너
- `.pros-cons` / `.pros` / `.cons` — 장단점 2열

### 배지 & 태그

- `.badge .badge-primary/success/warning/error/neutral/outline` — 소형 레이블
- `.tag .tag-primary/success/warning/error` — 필터/특징 태그

### 피드백 박스

- `.callout .callout-info/success/warning/error` — 강조 메시지 박스

### 간격 유틸리티

- `.mt-1~4` / `.mb-1~4` — 상하 마진 (6/12/20/32px)
- `.gap-sm/md/lg` — flex/grid 간격 (8/16/24px)
- `.flex` / `.flex-col` / `.items-center` / `.flex-wrap`

### 비교 테이블

- `.data-table` — `<table>` 에 적용, `.check` / `.cross` / `.partial` 셀 강조

### Mock UI

- `.mock-nav` / `.mock-nav-brand` / `.mock-nav-item.active`
- `.mock-sidebar` / `.mock-content`
- `.mock-button` / `.mock-button-outline` / `.mock-button-ghost`
- `.mock-input` / `.mock-tabs` / `.mock-tab.active`
- `.mock-list` / `.mock-list-item` / `.mock-avatar` / `.mock-chip`

### 기타

- `.metric` / `.metric-value` / `.metric-label` — KPI 숫자 강조
- `.rank` / `.rank-neutral` — 순위/단계 원형 표시
- `.placeholder` — 점선 빈 영역
- `.divider` — 수평 구분선

---

## 💡 화면이 여러 개일 때 — 탭 네비게이션 패턴

서버는 `/` 루트에서 **가장 최신 HTML 파일 하나만** 제공한다. 파일명으로 직접 접근(`/my-file.html`)하면 404가 난다.

따라서 화면이 2개 이상일 때는 **파일을 여러 개 만들지 말고**, 하나의 파일에 탭 전환 UI를 넣어라.

```html
<style>
  .screen { display: none; background: #0f172a; }
  .screen.active { display: block; }
  .tab-bar { display: flex; gap: 4px; margin-bottom: 20px;
             border-bottom: 2px solid #334155; }
  .tab-btn { padding: 8px 16px; font-size: 13px; font-weight: 600;
             cursor: pointer; border: none; background: none;
             color: #94a3b8;
             border-bottom: 2px solid transparent; margin-bottom: -2px; }
  .tab-btn.active { color: #60a5fa; border-bottom-color: #60a5fa; }
</style>

<div class="tab-bar">
  <button class="tab-btn active" onclick="showTab('home')">① 홈</button>
  <button class="tab-btn" onclick="showTab('player')">② 플레이어</button>
</div>

<div id="screen-home" class="screen active"> ... </div>
<div id="screen-player" class="screen"> ... </div>

<script>
function showTab(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  event.target.classList.add('active');
}
</script>
```

이 패턴을 쓰면 사용자가 한 URL에서 모든 화면을 탐색할 수 있다.

---

## ⚠️ 흔한 실수 (Common Mistakes)

- **CSS 변수(`var()`) 사용**: 브레인스토밍 서버는 디자인 시스템을 주입하지 않아 `var(--text)` 등이 렌더링되지 않음 — 커스텀 `<style>`에서는 하드코딩 hex 값만 사용. 위 Slate Dark 팔레트 참조
- **컨테이너에 배경색 미지정**: 서버의 기본 배경(밝은 색)이 노출되면 흰 텍스트가 안 보임 — `.screen` 및 주요 컨테이너에 반드시 `background: #0f172a` 명시. 텍스트가 포함된 영역에는 카드 배경(`background: #1e293b`)을 줘서 배경이 보장되도록 할 것
- **기존 파일명 재사용**: 브라우저 캐싱으로 인해 업데이트가 반영되지 않음 — 반드시 새 파일명 사용
- **화면별로 파일 분리**: 서버가 파일명 직접 접근을 지원하지 않음 — 여러 화면은 탭 네비게이션으로 한 파일에 담을 것
- **개념적 질문에 브라우저 사용**: 텍스트로 충분한 내용에 시안을 만드는 불필요한 오버헤드 발생
- **피드백 확인 누락**: `$STATE_DIR/events`를 읽지 않고 사용자 구두 피드백만 의존
