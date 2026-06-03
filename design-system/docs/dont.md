# Design System: DON'T (금지/지양 사항)

디자인 시스템을 어지럽히거나 다크/라이트 테마 등의 일관성을 해치는 대표적인 안티 패턴(Anti-patterns)들입니다.

---

## 1. 하드코딩된 색상 클래스 기입 금지 (Hardcoded Color Classes)
- **금지**: Tailwind의 원시 색상 유틸리티(예: `gray`, `zinc`, `red`, `blue` 등 특정 스펙트럼)를 `className`에 날것 그대로 하드코딩하지 마십시오.
  - `<div className="text-zinc-700 bg-blue-500 border border-slate-300">` ❌
- **사유**: 라이트/다크 모드에 따라 텍스트와 배경색이 동적으로 뒤바뀌거나 채도 조정이 일어나야 하는데, 하드코딩 시 모드 전환이 무력화되어 시인성을 상실하거나 접근성(Contrast) AA 규격을 위반하게 됩니다.

---

## 2. 인라인 스타일을 이용한 색상 직접 주입 금지 (Inline Styles for Colors)
- **금지**: React 컴포넌트의 `style` 속성에 직접 헥사코드나 rgba 색상을 기재해 스타일링하는 행위를 지양하십시오.
  - `<span style={{ color: '#0066FF', backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>` ❌
- **사유**: 테마 모드에 종속되는 동적 색상 통제가 불가능해지며, 스타일 디버깅 및 커스텀 트랜지션 처리가 어려워집니다. 필요한 경우 `var(--semantic-*)` CSS 변수를 매핑하거나 클래스로 전환하십시오.

---

## 3. 공통 컴포넌트(Primitive) 중복/독자 재구현 금지 (Primitive Duplication)
- **금지**: 이미 디자인 시스템 패키지(`design-system/components`)에 등록되어 있거나 export되고 있는 `Button`, `Card`, `TextField`, `Switch`, `Badge` 등을 개별 프로젝트 내에서 독립적으로 스타일을 덧칠해 재개발하지 마십시오.
- **사유**: 디자인 사양이 변경되었을 때(예: 버튼의 border-radius가 8px에서 6px로 바뀔 때) 프로젝트마다 스타일이 파편화되어 전체 UI의 통일성이 깨지고 유지보수 비용이 급증합니다.

---

## 4. Spacing Numeric Scale에 임의의 픽셀 임포트 금지 (Tailwind Spacing Manipulation)
- **금지**: Tailwind config의 기본 numeric 스케일(예: `spacing.8` 등)을 임의로 디자인 시스템 픽셀 크기에 매핑하려 시도하지 마십시오.
- **사유**: numeric scale은 Tailwind의 순수 base semantics(4px배수 rem 스케일)를 유지해야 외부 예제 복사나 플러그인 결합 시 레이아웃이 무너지지 않습니다. 반드시 `ds-` 접두사가 붙은 시맨틱 Spacing 유틸리티(`p-ds-8` 등)를 이용해야 합니다.
