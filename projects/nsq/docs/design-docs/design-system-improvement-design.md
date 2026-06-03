# Design System Refactoring: Semantic Tokens & Document Split

## 1. 목적 & 요구사항 (Goal & Requirements)

- **목적**:
  - 디자인 시스템 내에서 하드코딩되어 사용되던 임의의 색상 투명도(`rgba`) 값을 시맨틱 토큰으로 표준화하여, 라이트/다크 모드 간의 색상 대비 일관성 및 완벽한 테마 통제력을 확보합니다.
  - 지나치게 길어져 가독성 및 유지보수성이 저하된 `DESIGN.md` 문서를 카테고리별 개별 문서로 분리하고, 통합 인덱스 체계를 구축합니다.
- **요구사항**:
  - `globals.css` 및 `tailwind.config.ts`에 outlined/assistive 컴포넌트의 호버/액티브 상태를 정의하는 신규 시맨틱 토큰 추가.
  - `Button.tsx` 등의 아토믹 컴포넌트 내부에 잔존하는 하드코딩 `rgba(...)` 색상 유틸리티를 제거하고 새로 추가한 시맨틱 토큰 클래스로 교체.
  - `DESIGN.md`를 Foundations, Components, Accessibility/Usage 세 파트로 분리하고 메인 명세 문서는 인덱스로 축소.

## 2. 검증 및 피드백 (Evaluation & Feedback)

- **판별자(Evaluator)가 제기한 주요 이슈**:
  1. **다크 모드 시인성 부족**: 다크 모드 환경(`coolNeutral-15` 등)에서 Outlined 호버 투명도를 4%(`0.04`)로 일괄 고정할 경우 대비가 너무 작아 화면상에서 호버 효과가 시각적으로 전혀 식별되지 않을 리스크가 존재함.
  2. **링크 깨짐 예방**: `DESIGN.md` 분리 시 모노레포 내부의 기존 `AGENTS.md` 등에서 참조 중인 `design-system/DESIGN.md` 링크들이 깨질 우려가 있음.
- **조정(Refining) 및 반영 대책**:
  1. **다크 모드 투명도 조정**: `--semantic-primary-outlined-hover-bg`를 비롯한 outlined-hover 토큰들의 다크 모드 불투명도를 `8%`(`0.08`)로 상향하여 다크 배경에서의 시인성을 확보함.
  2. **링크 전수 업데이트**: 작업 계획에 기존 파일 내 `DESIGN.md` 참조 경로를 `grep`으로 일괄 탐색하여 수정하는 단계를 추가함.

## 3. 상세 설계 (Detailed Design)

### 3.1. 시맨틱 토큰 추가 명세

- **`globals.css` 신규 CSS 변수**:
  - `--semantic-primary-outlined-hover-bg`
    - Light: `rgba(0, 102, 255, 0.04)` (blue-50 기반 4%)
    - Dark: `rgba(51, 133, 255, 0.08)` (blue-60 기반 8%)
  - `--semantic-assistive-outlined-hover-bg`
    - Light: `rgba(112, 115, 124, 0.08)` (coolNeutral-50 기반 8%, fill-normal과 연계)
    - Dark: `rgba(112, 115, 124, 0.22)` (coolNeutral-50 기반 22%)
  - `--semantic-positive-outlined-hover-bg`
    - Light: `rgba(18, 213, 137, 0.04)` (green-50 기반 4%)
    - Dark: `rgba(47, 229, 154, 0.08)` (green-60 기반 8%)
  - `--semantic-negative-outlined-hover-bg`
    - Light: `rgba(255, 66, 66, 0.04)` (red-50 기반 4%)
    - Dark: `rgba(255, 99, 99, 0.08)` (red-60 기반 8%)

- **`tailwind.config.ts` 매핑**:
  - `colors` 내에 아래 속성 매핑 추가:
    - `primary-outlined-hover`: `var(--semantic-primary-outlined-hover-bg)`
    - `assistive-outlined-hover`: `var(--semantic-assistive-outlined-hover-bg)`
    - `positive-outlined-hover`: `var(--semantic-positive-outlined-hover-bg)`
    - `negative-outlined-hover`: `var(--semantic-negative-outlined-hover-bg)`

- **컴포넌트 리팩토링 (`Button.tsx`)**:
  - 하드코딩 투명도(`enabled:hover:bg-[rgba(...)]`)를 Tailwind 클래스(`bg-primary-outlined-hover` 등)로 대체 적용.

### 3.2. 명세 문서 분리 계획

- **`design-system/docs/foundations.md`**: 서체, 색상, Spacing, Shadows, Radius 등 기본 토큰 정의.
- **`design-system/docs/components.md`**: 각 컴포넌트(Button, Typography, Icon 등)의 props 명세 및 디자인 원칙.
- **`design-system/docs/accessibility-usage.md`**: 접근성 가이드 및 Provider/Font 설정 가이드.
- **`design-system/DESIGN.md`**: 메인 인덱스 역할로 축소하여 각 파트별 마크다운 문서 링크 관리.

## 4. 예외 및 실패 대응 (Edge Cases & Fault Tolerance)

- **하이드레이션 불일치 및 다크모드 깜빡임 방지**: next-themes 로드 시점에 브라우저 로컬스토리지 테마 속성과 SSR 결과물의 테마가 일치하도록 Providers에 `suppressHydrationWarning` 속성을 정확히 적용하고, 테마가 마운트되기 전 렌더링을 지연시키는 등의 가드 로직을 지속 검토함.
