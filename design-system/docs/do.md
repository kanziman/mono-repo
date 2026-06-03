# Design System: DO (권장 사항)

디자인 시스템의 일관성을 유지하고 결함을 최소화하기 위해 반드시 준수해야 하는 권장 사항입니다.

---

## 1. 시맨틱 디자인 토큰 사용의 생활화
- **원칙**: 직접적인 헥사코드(`#FFF`, `#000` 등)나 Tailwind의 기본 원시 색상명(`text-red-500`, `bg-zinc-800` 등)을 소스코드 내에 작성하지 마십시오.
- **예시**:
  - `bg-white` ❌ ➡️ `bg-background-normal-normal` 또는 `bg-background-elevated-normal` ⭕
  - `text-gray-900` ❌ ➡️ `text-label-normal` ⭕
  - `text-gray-500` ❌ ➡️ `text-label-assistive` ⭕

---

## 2. 공통 컴포넌트 적극적 재사용
- **원칙**: 버튼, 입력 폼, 카드 등 기본 아토믹 단위는 개별 프로젝트에서 마크업으로 직접 재구현하지 말고, 반드시 `@ds` alias를 통해 공유 패키지(`design-system/components`)에 내장된 컴포넌트를 호출해 사용하십시오.
- **예시**:
  - `<button className="px-4 py-2 bg-blue-500 text-white rounded">` ❌
  - `<Button variant="solid" color="primary" size="medium">` ⭕

---

## 3. 다크 모드(Light/Dark Theme) 자동 대응 고려
- **원칙**: 배경 및 텍스트 색상, 외곽선, 그림자 효과는 상단에 주입된 `.dark` 클래스에 따라 유동적으로 전환되는 의미론적 CSS 변수들을 참조합니다. 따라서 테마 모드 대응을 상속받으려면 CSS 변수 구조(`var(--semantic-*)`) 또는 이에 매핑된 Tailwind 토큰명을 지켜야 합니다.

---

## 4. Spacing에 ds-* 규격 적용
- **원칙**: 디자인 사양에 명시된 간격(px)을 적용할 때에는 `p-ds-8`, `gap-ds-16` 과 같이 `ds-*` 스케일 키를 활용하십시오. (숫자형 기본 유틸리티 `p-8`, `gap-10` 등은 Tailwind 기본 의미론을 파괴하지 않기 위해 보존되어 있습니다.)

---

## 5. ARIA 규격 및 키보드 포커스 준수
- **원칙**: 상호작용 가능한 요소에는 포커스 링(`.focus-visible:ring-2`)이 필수이며, 아이콘으로만 이루어진 버튼 등에는 스크린 리더기를 위한 `aria-label`을 명시해야 합니다.
