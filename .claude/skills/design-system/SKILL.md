---
name: design-system
description: 디자인 시스템 시맨틱 토큰 사용을 준수하고, 하드코딩된 색상 및 인라인 스타일을 방지하여 라이트/다크 테마 및 컴포넌트 일관성을 유지하는 에이전트 지침 스킬입니다.
---

# design-system

이 스킬은 프로젝트 내 모든 프론트엔드 작업(`*.tsx`, `*.jsx`, `*.css` 등) 시 공통 디자인 시스템(Wanted Montage 기반)의 토큰과 컴포넌트를 정확하게 활용하도록 강제하여 파편화를 막는 개발 지침을 정의합니다.

---

## 🛠️ 핵심 체크리스트 (Checklist)

1. `[ ]` **하드코딩 색상 절대 금지**: 소스코드에 원시 색상 유틸리티(예: `text-gray-500`, `bg-blue-600` 등)나 직접 헥사코드/rgba(예: `#FFF`, `rgb(0,0,0)`)를 하드코딩해서 사용하지 마십시오. 반드시 시맨틱 컬러 토큰을 매핑하여 쓰십시오.
2. `[ ]` **인라인 스타일 색상 직접 선언 금지**: `style={{ color: '#0066FF' }}` 와 같은 직접 선언을 지양하고, CSS 변수를 매핑하거나 Tailwind 시맨틱 클래스로 대체하십시오.
3. `[ ]` **공통 프리미티브 컴포넌트 우선 재사용**: `Button`, `Card`, `TextField`, `Switch`, `Badge`, `Skeleton` 등 아토믹 단위 UI 요소는 처음부터 직접 작성하지 말고 반드시 `@ds` alias (`design-system/components`)를 통해 호출해 사용하십시오.
4. `[ ]` **Spacing `ds-*` 스케일 적용**: 디자인 명세에 픽셀 스케일이 직접 지정되어 있을 때에는 `p-ds-8`, `gap-ds-16` 등 `ds-` 접두사 스크립트를 사용하십시오. (`p-8`, `gap-10` 등은 Tailwind 순수 기본 rem 배수를 위해 남겨져 있습니다.)
5. `[ ]` **포커스 링 및 ARIA 접근성 준수**: 상호작용 가능한 컨트롤에는 명확한 키보드 포커스 링 outline(`primary.normal`)을 부여하고, 스크린 리더용 ARIA 속성을 선언하십시오.

---

## 🔍 디자인 시스템 린트 검사 훅 (Verification Hook)

- **검증 규칙**: 본 모노레포의 ESLint Flat Config(`eslint.config.mjs`)에는 디자인 시스템 규격 위반을 상시 검사하는 **`design-system/no-hardcoded-colors`** 규칙이 `"error"` 레벨로 활성화되어 있습니다.
- **동작 시점**:
  1. **PostToolUse 린터**: 에이전트가 소스코드를 수정하여 저장하는 즉시 백엔드에서 린터가 구동되어 위반 코드를 감지하고 에러로 반환합니다.
  2. **pre-commit (lint-staged)**: Git 커밋 시점에 린트가 구동되어 위반 사항 발견 시 커밋이 즉시 반려(exit 1)됩니다.
- 에러가 발생한 경우, 땜질식 린트 예외 주석(`/* eslint-disable-next-line */`)을 달아 회피하려 하지 말고, 반드시 올바른 시맨틱 컬러 토큰으로 코드를 수정하여 해결하십시오.

---

## 📄 디자인 시스템 문서 지도 (Documentation Map)

세부 디자인 사양이 궁금하거나 신규 컴포넌트를 사용해야 할 때 아래 지도를 참조하십시오:

- [DESIGN.md (디자인 시스템 인덱스)](../../../design-system/DESIGN.md)
  - [foundations.md (서체, 색상, Spacing, Shadows, Radius 명세)](../../../design-system/docs/foundations.md)
  - [components.md (공통 UI 컴포넌트 및 Icons API)](../../../design-system/docs/components.md)
  - [accessibility-usage.md (접근성 가이드 및 Provider 연동법)](../../../design-system/docs/accessibility-usage.md)
  - [do.md (디자인 시스템 권장 사항 가이드)](../../../design-system/docs/do.md)
  - [dont.md (디자인 시스템 안티 패턴/금지 사항 가이드)](../../../design-system/docs/dont.md)
