---
title: "react-day-picker v9에서 IconLeft/IconRight API 제거로 design-system 빌드 실패"
date: 2026-05-30
tags: [react-day-picker, design-system, breaking-change, dependency, downgrade]
problem_type: bug
---

# 문제

`react-day-picker`를 최신 버전(`^9.x`)으로 설치하면 design-system 컴포넌트 빌드 시 타입/런타임 오류가 발생한다.

에러 메시지:
```
Module not found: Can't resolve 'react-day-picker'
// 또는 설치 후:
Type error: Property 'IconLeft' does not exist on type 'DayPickerProps'
Type error: Property 'IconRight' does not exist on type 'DayPickerProps'
```

재현 조건:
- `mono-repo/design-system/`이 DatePicker 컴포넌트를 포함
- design-system이 `react-day-picker`의 `IconLeft` / `IconRight` props를 사용
- `npm install react-day-picker` 또는 `react-day-picker@latest`로 v9.x 설치

# 실패한 시도

- **`@ts-ignore` 추가**: 타입 오류는 숨길 수 있지만 런타임에서 실제로 해당 props가 작동하지 않음
- **`typescript.ignoreBuildErrors: true`만 적용**: 타입 오류는 우회되지만 기능이 깨짐

# 해결책

`react-day-picker@8`(v8의 최신 패치 버전)을 명시적으로 설치한다.

```bash
npm install react-day-picker@8
# 또는
npm install react-day-picker@^8.10.2
```

`package.json`:
```json
{
  "dependencies": {
    "react-day-picker": "^8.10.2"
  }
}
```

# 원인 분석

react-day-picker v9는 컴포넌트 API를 대폭 변경했다.
v8에서 `<DayPicker IconLeft={...} IconRight={...} />` 형태로 제공되던 내비게이션 아이콘 커스터마이징 props가
v9에서는 `components` prop 내부의 구조로 바뀌었다(`components={{ Chevron: ... }}`).

mono-repo의 design-system은 v8 API를 기준으로 작성되어 있으므로,
v9를 설치하면 해당 props를 인식하지 못한다.

# 재발 방지

- design-system의 DatePicker가 사용하는 react-day-picker 버전을 `AGENTS.md` 또는 design-system README에 명시한다.
- 프로젝트에서 react-day-picker를 설치할 때 버전을 반드시 고정한다(`react-day-picker@8`).
- design-system을 v9로 마이그레이션할 경우, `components={{ Chevron }}` API로 전면 수정이 필요하다.
- `npm install` 후 `react-day-picker` 버전 확인:
  ```bash
  npm ls react-day-picker
  ```
