# Design System Accessibility & Usage Guide

이 문서는 디자인 시스템을 웹 애플리케이션에 적용하는 방법과 접근성(Accessibility) 준수 가이드라인을 다룹니다.

---

## 1. 접근성 (Accessibility)

| 항목 | 가이드 |
|---|---|
| **색상 대비** | WCAG AA 기준 충족 (일반 텍스트 4.5:1, 대형 텍스트 3:1) |
| **포커스 링** | 키보드 탐색 시 명확한 outline 표시 (`primary.normal` 컬러) |
| **터치 영역** | 상호작용 요소 최소 44×44px 확보 |
| **ARIA 레이블** | 아이콘 전용 버튼에 `aria-label` 필수 |
| **의미론적 HTML** | `<button>`, `<nav>`, `<main>`, `<header>` 등 시맨틱 태그 사용 |
| **색상 단독 의존 금지** | 상태 표현 시 색상 + 아이콘 또는 텍스트 병행 |
| **다크모드** | `next-themes`의 `ThemeProvider`를 사용하여 `.dark` 클래스로 제어 |

---

## 2. 적용 가이드 (Usage Guide)

### 2.1. 폰트 로드

HTML 헤더에 아래 CDN 경로의 폰트 파일을 연동합니다.

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" />
<link rel="stylesheet" crossorigin
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css" />
```

### 2.2. Provider 설정 (`next-themes`)

Next.js 환경에서 다크모드/라이트모드 전환 시 깜빡임을 방지하기 위해 `next-themes`를 사용합니다.

```tsx
import { ThemeProvider } from "next-themes";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2.3. 스타일링 — CSS 변수 (권장)

CSS 변수를 활용해 시맨틱 컬러와 그림자 등의 스타일을 상속합니다.

```css
.card {
  background-color: var(--semantic-background-elevated-normal);
  color: var(--semantic-label-normal);
  border: 1px solid var(--semantic-line-normal-normal);
  padding: 24px; /* spacing[24] */
  border-radius: 16px;
  box-shadow: var(--elevation-shadow-normal-small);
}
```

### 2.4. 스타일링 — TailwindCSS

TailwindCSS 설정(`tailwind.config.ts`)에 디자인 토큰을 매핑하여, 유틸리티 클래스로 시맨틱 컬러와 타이포그래피를 적용합니다.

```tsx
import React from 'react';

const Card = ({ children, hoverable }) => (
  <div className={`
    bg-background-elevated-normal text-label-normal p-6 rounded-[16px] shadow-normal-small
    ${hoverable ? 'hover:shadow-normal-medium transition-shadow duration-200' : ''}
  `}>
    {children}
  </div>
);
```

> **주의**: 모달이나 텍스트 밀도가 높은 오버레이에는 Glassmorphism(반투명 블러) 대신 `bg-background-elevated-normal` 같은 불투명한 솔리드 배경을 사용하여 가독성을 확보해야 합니다.

### 2.5. 반응형 적용

```tsx
import { useTheme } from '@your-design-system';

// CSS Media Query
@media (min-width: 768px) { /* sm */ }
@media (min-width: 992px) { /* md */ }
@media (min-width: 1200px) { /* lg */ }
```

### 2.6. 아이콘 사용 예시 (`Icon.tsx`)

직접 SVG를 작성하는 대신, 미리 정의된 `Icon` 컴포넌트를 사용합니다. 크기(`size`)와 아이콘 이름(`name`)을 지원합니다.

```tsx
import { Icon } from '@/components/Icon/Icon';

// 기본 24px 아이콘
<Icon name="search" />

// 크기와 커스텀 클래스 지정
<Icon name="close" size={16} className="text-label-assistive" />
```
