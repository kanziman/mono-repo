# Visual Companion Guide

브라우저 기반의 시각적 브레인스토밍 컴패니언(Visual Brainstorming Companion)을 사용하여 와이어프레임, 레이아웃 비교 및 시각적 피드백을 수집하는 가이드입니다.

## 📌 핵심 판단 기준
모든 질문마다 **"사용자가 텍스트보다 화면을 직접 보고 이해하는 것이 유리한가?"**를 기준으로 판단하십시오.

*   **브라우저 사용 대상 (시각적 컨텐츠)**: UI 레이아웃, 와이어프레임, 컴포넌트 디자인, 색상 및 레이아웃 비교 시안
*   **터미널 사용 대상 (개념적 컨텐츠)**: 기능 범위 정의, 정책 의사결정, pros/cons 설명 등 텍스트 중심 질문

---

## 🔄 작동 워크플로우 (How It Works)

1.  **서버 정보 확인**: `$STATE_DIR/server-info`를 읽어 URL 및 포트를 파악합니다.
2.  **HTML 프래그먼트 작성**: `screen_dir` 경로에 새 HTML 파일을 작성합니다. (기본 템플릿 프레임과 CSS 테마는 서버가 자동 래핑하므로 `<body>` 내의 프래그먼트만 작성하면 됩니다.)
    -   *주의*: 기존 파일명을 절대 재사용하지 말고 새로운 버전(예: `layout-v2.html`)으로 작성하십시오.
3.  **사용자 응답 대기**: 사용자에게 URL 링크를 제공하고 브라우저 클릭 또는 터미널 텍스트 피드백을 요청합니다.
4.  **피드백 확인**: 사용자의 클릭 데이터는 `$STATE_DIR/events`에 JSON lines 형태로 기록됩니다. 이를 파악하여 설계를 보완하십시오.

---

## 🎨 사용 가능한 CSS 클래스 (CSS Classes)

*   **A/B/C 옵션 선택**: `<div class="options">` 아래 `<div class="option" data-choice="a" onclick="toggleSelect(this)">` 사용 (다중 선택 시 부모에 `data-multiselect` 추가)
*   **카드형 배치**: `<div class="cards">` 하위에 `<div class="card" data-choice="item" onclick="toggleSelect(this)">` 구조 배치
*   **화면 분할 (Split)**: `<div class="split">`을 사용하여 좌우에 `<div class="mockup">` 배치
*   **Pros & Cons**: `<div class="pros-cons">` 내부에 `<div class="pros">` 및 `<div class="cons">` 배치
*   **와이어프레임 컴포넌트**: `.mock-nav`, `.mock-sidebar`, `.mock-content`, `.mock-button`, `.mock-input` 사용 가능
