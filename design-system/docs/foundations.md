# Design System Foundations

이 문서는 웹 디자인 시스템의 기초 파운데이션(서체, 색상, 간격, Z-Index 등) 명세를 다룹니다.

---

## 1. 서체 (Typography)

**Font Family**: `'Pretendard', sans-serif`  
**Weights**: Regular(400), Medium(500), Bold(600/700)

> Display~Title의 Bold는 `700`, 그 이하는 `600`.

| Variant | Size | Line Height | Letter Spacing | 용도 |
|---|---|---|---|---|
| **display1** | 3.5rem | 4.5rem | -0.0319em | 랜딩 히어로 타이틀 |
| **display2** | 2.5rem | 3.25rem | -0.0282em | 섹션 메인 타이틀 |
| **display3** | 2.25rem | 3.0rem | -0.027em | 강조 타이틀 |
| **title1** | 2.0rem | 2.75rem | -0.0253em | 페이지 대제목 |
| **title2** | 1.75rem | 2.375rem | -0.0236em | 페이지 중제목 |
| **title3** | 1.5rem | 2.0rem | -0.023em | 카드/모달 타이틀 |
| **heading1** | 1.375rem | 1.875rem | -0.0194em | 본문 소제목 |
| **heading2** | 1.25rem | 1.75rem | -0.012em | 본문 소제목 |
| **headline1** | 1.125rem | 1.625rem | -0.002em | 리스트 항목 |
| **headline2** | 1.0625rem | 1.5rem | 0em | 리스트 항목 |
| **body1** | 1.0rem | 1.5rem | 0.0057em | 일반 본문 |
| **body1-reading** | 1.0rem | 1.625rem | 0.0057em | 긴 본문 읽기 |
| **body2** | 0.9375rem | 1.375rem | 0.0096em | 부가 본문 |
| **body2-reading** | 0.9375rem | 1.5rem | 0.0096em | 긴 부가 본문 |
| **label1** | 0.875rem | 1.25rem | 0.0145em | 버튼, 칩, 뱃지 |
| **label1-reading** | 0.875rem | 1.375rem | 0.0145em | - |
| **label2** | 0.8125rem | 1.125rem | 0.0194em | 작은 레이블 |
| **caption1** | 0.75rem | 1.0rem | 0.0252em | 부가 설명, 타임스탬프 |
| **caption2** | 0.6875rem | 0.875rem | 0.0311em | 최소 텍스트 |

---

## 2. 색상 (Color System)

색상은 **Atomic(원시)** → **Semantic(의미론적)** 2단계 구조로 이루어집니다.  
개발 시 **반드시 Semantic 토큰을 사용**하고 Atomic 값을 직접 참조하지 않습니다.

### 2.1. Atomic Colors (원시 색상 팔레트)

| Palette | Key Values (HEX) |
|---|---|
| **blue** | 10:`#001536` 20:`#002966` 30:`#003E9C` 40:`#0054D1` 45:`#005EEB` **50:`#0066FF`** 55:`#1A75FF` 60:`#3385FF` 70:`#69A5FF` 90:`#C9DEFE` |
| **coolNeutral** | 5:`#0F0F10` 10:`#171719` 15:`#1B1C1E` 22:`#2E2F33` 25:`#37383C` 40:`#5A5C63` **50:`#70737C`** 70:`#989BA2` 95:`#DBDCDF` 97:`#EAEBEC` 98:`#F4F4F5` **99:`#F7F7F8`** |
| **neutral** | 10:`#0D0D0D` ... |
| **red** | 40:`#E52222` **50:`#FF4242`** 60:`#FF6363` 90:`#FED5D5` |
| **green** | 40:`#0FAF6E` **50:`#12D589`** 60:`#2FE59A` 90:`#C2F5E3` |
| **orange** | 39:`#C95400` **50:`#FF7A00`** 60:`#FF9533` |
| **common** | 0:`#000000` 100:`#FFFFFF` |
| redOrange, lime, cyan, lightBlue, violet, purple, pink | — 각 팔레트 10~99 단계 |

### 2.2. Semantic Color Tokens

| Token | Light | Dark | 용도 |
|---|---|---|---|
| `primary.normal` | blue[50] `#0066FF` | blue[60] `#3385FF` | 주요 버튼, 활성 상태 |
| `primary.strong` | blue[45] | blue[55] | Hover 상태 |
| `primary.heavy` | blue[40] | blue[50] | Active/Pressed 상태 |
| `label.normal` | coolNeutral[10] | coolNeutral[99] | 기본 텍스트 |
| `label.strong` | common[0] `#000` | common[100] `#FFF` | 강조 텍스트 |
| `label.neutral` | coolNeutral[22] @ 88% | coolNeutral[90] @ 88% | 보조 텍스트 |
| `label.alternative` | coolNeutral[25] @ 61% | coolNeutral[80] @ 61% | 대안 텍스트 |
| `label.assistive` | coolNeutral[25] @ 28% | coolNeutral[80] @ 28% | 보조 설명 |
| `label.disable` | coolNeutral[25] @ 16% | coolNeutral[70] @ 16% | 비활성 텍스트 |
| `background.normal.normal` | common[100] | coolNeutral[15] | 기본 페이지 배경 |
| `background.normal.alternative` | coolNeutral[99] | coolNeutral[5] | 보조 배경 |
| `background.elevated.normal` | common[100] | coolNeutral[17] | 카드, 팝업 배경 |
| `interaction.inactive` | coolNeutral[70] | coolNeutral[40] | 비활성 인터랙션 |
| `interaction.disable` | coolNeutral[98] | coolNeutral[22] | 비활성 배경 |
| `line.normal.normal` | coolNeutral[50] @ 22% | coolNeutral[50] @ 32% | 기본 구분선 |
| `line.solid.normal` | coolNeutral[96] | coolNeutral[25] | 실선 구분선 |
| `status.positive` | green[50] | green[60] | 성공/긍정 |
| `status.cautionary` | orange[50] | orange[60] | 경고 |
| `status.negative` | red[50] | red[60] | 오류/위험 |
| `fill.normal` | coolNeutral[50] @ 8% | coolNeutral[50] @ 22% | 기본 채우기 |
| `fill.strong` | coolNeutral[50] @ 16% | coolNeutral[50] @ 28% | 강조 채우기 |
| `material.dimmer` | coolNeutral[10] @ 52% | coolNeutral[10] @ 74% | 모달 딤 처리 |
| `inverse.primary` | blue[60] | blue[50] | 반전 주요 컬러 |
| `inverse.background` | coolNeutral[15] | common[100] | 반전 배경 |
| `accent.background.*` | redOrange/lime/cyan/lightBlue/violet/purple/pink [50] | — [60] | 다양한 액센트 배경 |

---

## 3. 간격 (Spacing)

8pt 기반 스페이싱 스케일을 사용합니다.

| Token | Value | 주요 용도 |
|---|---|---|
| `spacing[0]` | 0px | — |
| `spacing[2]` | 2px | 아이콘 내부 간격 |
| `spacing[4]` | 4px | 인라인 간격 |
| `spacing[6]` | 6px | — |
| `spacing[8]` | 8px | 소형 패딩 |
| `spacing[10]` | 10px | — |
| `spacing[12]` | 12px | 컴포넌트 내부 패딩 |
| `spacing[16]` | 16px | 기본 패딩 |
| `spacing[20]` | 20px | — |
| `spacing[24]` | 24px | 카드 패딩 |
| `spacing[32]` | 32px | 섹션 간격 |
| `spacing[40]` | 40px | 콘텐츠 패딩 |
| `spacing[48]` | 48px | — |
| `spacing[56]` | 56px | — |
| `spacing[64]` | 64px | 섹션 상하 여백 |
| `spacing[72]` | 72px | — |
| `spacing[80]` | 80px | 대형 섹션 여백 |

### Tailwind Utility Contract

Tailwind numeric spacing utilities keep Tailwind's base semantics. Do not redefine numeric keys such as `4`, `8`, `10`, or `12` in `theme.extend.spacing`.

| Use case | Utility example | Meaning |
|---|---|---|
| Tailwind base spacing | `h-8`, `p-4`, `gap-10` | Tailwind default scale (`h-8` = 2rem = 32px) |
| Exact design-system spacing token | `h-ds-8`, `p-ds-12`, `gap-ds-24` | CSS token value (`ds-8` = `var(--spacing-8)` = 8px) |

Do not read `h-8`, `w-8`, `gap-8`, or `p-8` as `spacing[8] = 8px`. Numeric Tailwind utilities are reserved for Tailwind base behavior. Use the `ds-*` namespace when an exact design-system pixel token is required.

---

## 4. 반응형 브레이크포인트 (Breakpoints)

| Token | Value | 용도 |
|---|---|---|
| `breakpoint.xs` | 0px | 모바일 기본 |
| `breakpoint.sm` | 768px | 태블릿 시작 |
| `breakpoint.md` | 992px | 소형 데스크탑 |
| `breakpoint.lg` | 1200px | 일반 데스크탑 |
| `breakpoint.xl` | 1600px | 와이드 스크린 |

---

## 5. 불투명도 (Opacity)

| Token | Value |
|---|---|
| `opacity[5]` | 0.05 |
| `opacity[8]` | 0.08 |
| `opacity[12]` | 0.12 |
| `opacity[16]` | 0.16 |
| `opacity[22]` | 0.22 |
| `opacity[28]` | 0.28 |
| `opacity[61]` | 0.61 |
| `opacity[88]` | 0.88 |

---

## 6. Z-Index

| Token | Value | 용도 |
|---|---|---|
| `zIndex.modal` | 1300 | 모달, 드로어 |
| *(관행)* | 1200 | 스낵바, 토스트 |
| *(관행)* | 1100 | 툴팁 |
| *(관행)* | 1000 | 팝오버, 드롭다운 |
| *(관행)* | 100 | 스티키 헤더 |

---

## 7. 고도 및 그림자 (Elevation & Shadow)

| Token | 값 요약 | 용도 |
|---|---|---|
| `shadow.normal.xsmall` | `0 1px 2px -1px rgba(..,.1)` | 인풋, 작은 카드 |
| `shadow.normal.small` | `0 2px 4px ... + 0 4px 6px` | 일반 카드 |
| `shadow.normal.medium` | `0 4px 6px ... + 0 10px 15px` | 팝오버, 드롭다운 |
| `shadow.normal.large` | `0 6px 10px ... + 0 16px 24px` | 모달 |
| `shadow.normal.xlarge` | `0 10px 15px ... + 0 24px 38px` | 풀스크린 오버레이 |
| `shadow.drop.xsmall~xlarge` | `drop-shadow(...)` | SVG/아이콘 그림자 |
| `shadow.spread.small` | `0 0 60px rgba(..,.1)` | 배경 glow 효과 |
| `shadow.spread.medium` | `0 15px 75px rgba(..,.16)` | 히어로 섹션 |

---

## 8. 테두리 반경 (Border Radius)

| 용도 | 값 |
|---|---|
| 소형 컴포넌트 (Chip, Badge, Tag) | `6px` |
| 버튼, 인풋 | `8px` |
| 카드, 패널 | `12px ~ 16px` |
| 아바타, 원형 버튼 | `50%` (circle) |
| 바텀시트, 모달 상단 | `20px` |
