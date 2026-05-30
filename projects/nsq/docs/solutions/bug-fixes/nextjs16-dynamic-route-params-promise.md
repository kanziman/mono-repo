---
title: "Next.js 15+/16에서 Dynamic Route params가 Promise 타입으로 변경"
date: 2026-05-30
tags: [next-js, next-js-16, dynamic-route, params, typescript, async]
problem_type: bug
---

# 문제

Next.js 16(또는 15+)에서 Dynamic Route handler(`/api/episodes/[videoId]/route.ts`)를 작성할 때 빌드/런타임 오류가 발생한다.

에러 메시지:
```
Type '{ params: { videoId: string }; }' is not assignable to type '...'.
  Type '{ videoId: string; }' is missing the following properties from type 'Promise<...>'
```

또는 런타임에서 `params.videoId`가 `undefined`로 나온다.

재현 조건:
- Next.js 15.0+ (특히 16.x)
- App Router의 Route Handler 또는 Page 컴포넌트에서 params 사용
- 이전 Next.js 14 스타일 타입 사용

# 실패한 시도

- **타입 단언(as)으로 무시**: 런타임 오류는 해결되지 않음 — params 자체가 Promise 객체이므로 `.videoId`가 undefined
- **params를 직접 구조분해**: `const { videoId } = params` — params가 Promise이므로 videoId가 Promise가 됨

# 해결책

params를 `Promise<{ videoId: string }>` 타입으로 선언하고 `await`한다.

**Route Handler (`route.ts`):**
```ts
// ❌ Next.js 14 이하 스타일
export async function GET(
  _req: Request,
  { params }: { params: { videoId: string } }
) {
  const { videoId } = params  // videoId가 undefined
}

// ✅ Next.js 15+/16 스타일
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params  // 정상 동작
}
```

**Page 컴포넌트 (`page.tsx`):**
```tsx
// ❌
export default function Page({ params }: { params: { videoId: string } }) { ... }

// ✅
export default async function Page({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params
  ...
}
```

# 원인 분석

Next.js 15에서 params와 searchParams가 동기(synchronous)에서 비동기(asynchronous)로 변경되었다.
이는 React 19의 Async Server Components 방향성과 맞물린 변경으로,
동적 라우트의 파라미터 해석이 이제 Promise 기반으로 동작한다.

Next.js 14까지는 params가 즉시 값을 가진 객체였지만,
15/16부터는 런타임이 params를 Promise로 감싸서 전달한다.

# 재발 방지

- Next.js 15+ 프로젝트에서 Dynamic Route를 새로 작성할 때는 **항상** `params: Promise<{...}>` + `await params` 패턴을 사용한다.
- 기존 Next.js 14 코드를 15+로 마이그레이션할 때 모든 route handler와 page에서 params 타입을 일괄 검색하여 수정한다:
  ```bash
  grep -r "params: {" src/app --include="*.ts" --include="*.tsx" -l
  ```
