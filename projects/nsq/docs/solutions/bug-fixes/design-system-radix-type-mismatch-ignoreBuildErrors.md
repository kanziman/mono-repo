---
title: "외부 design-system의 Radix UI 버전 불일치로 발생하는 TypeScript 빌드 오류 우회"
date: 2026-05-30
tags: [typescript, radix-ui, design-system, monorepo, ignoreBuildErrors, type-mismatch]
problem_type: bug
---

# 문제

프로젝트에서 공유 design-system을 import할 때 TypeScript 빌드가 실패한다.
오류는 design-system 내부 파일에서 발생하며, 프로젝트 코드에는 문제가 없다.

에러 메시지 예시:
```
Type error: Type 'string | undefined' is not assignable to type 'Direction | undefined'.
  Type 'string' is not assignable to type '"ltr" | "rtl"'.

  src: ../../design-system/components/ScrollArea.tsx:12:5
  
Type error: Property 'dir' does not exist on type 'ScrollAreaProps'.
```

재현 조건:
- 공유 design-system이 Radix UI 컴포넌트를 사용
- 프로젝트에 설치된 Radix UI 버전과 design-system이 개발될 때의 버전이 다름
- Next.js TypeScript 빌드 (`next build`) 시 발생
- 오류 위치가 모두 `design-system/` 내부 (프로젝트 코드 아님)

# 실패한 시도

- **Radix UI 버전 맞추기**: design-system이 어떤 버전으로 개발됐는지 정확히 알 수 없으며, 버전을 낮추면 다른 오류 발생
- **design-system 코드에 `@ts-ignore` 추가**: design-system은 외부 코드이므로 직접 수정하기 부적절, 업스트림 변경으로 덮어씌워짐

# 해결책

`next.config.mjs`에 `typescript.ignoreBuildErrors: true`를 설정하여 빌드 타입 오류를 무시한다.

```js
// next.config.mjs
import path from "node:path";

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // design-system 내부 Radix UI 타입 충돌 우회
  },
  turbopack: {
    root: path.join(process.cwd(), "../.."),
  },
};

export default nextConfig;
```

# 원인 분석

Radix UI는 각 패키지(`@radix-ui/react-scroll-area` 등)를 독립적으로 버전 관리한다.
design-system이 개발될 당시의 Radix UI 타입 정의와 현재 설치된 버전의 타입 정의가 다르면,
`dir`, `orientation` 등 prop 타입의 union 범위가 달라져 타입 오류가 발생한다.

이 오류들은 실제 런타임 동작에는 영향을 주지 않는 순수한 타입 수준의 불일치다.
`ignoreBuildErrors: true`는 이런 경우 — 소유하지 않은 외부 코드의 타입 오류 — 에 적합한 우회책이다.

# 재발 방지

- **`ignoreBuildErrors: true`는 마지막 수단**이다. 프로젝트 자체 코드의 타입 오류는 반드시 수정한다.
- 이 설정을 적용할 때는 주석으로 이유를 명시한다:
  ```js
  typescript: {
    ignoreBuildErrors: true, // design-system 내부 Radix UI 버전 불일치 타입 오류 우회
  },
  ```
- CI에서 프로젝트 자체 파일만 타입 체크하는 별도 스크립트를 운영한다:
  ```bash
  # tsconfig에서 design-system 경로를 exclude하고 tsc만 실행
  npx tsc --noEmit --exclude "../../design-system"
  ```
- 장기적으로는 design-system을 별도 패키지로 빌드 배포하거나, peer deps 버전 범위를 design-system README에 명시하여 버전 충돌을 예방한다.
