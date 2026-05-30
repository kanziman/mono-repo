---
title: "Turbopack 모노레포에서 design-system의 peer deps를 찾지 못하는 문제"
date: 2026-05-30
last_updated: 2026-05-30
tags: [turbopack, monorepo, symlink, radix-ui, design-system, next-js, broken-symlink]
problem_type: architecture
---

# 문제

Next.js(Turbopack) + 워크트리(worktree) 환경에서 `@ds` alias로 design-system 컴포넌트를 import할 때 빌드가 실패한다.

에러 메시지:
```
Module not found: Can't resolve '@radix-ui/react-scroll-area'
Module not found: Can't resolve '@radix-ui/react-accordion'
... (16개 유사 에러)
Module not found: Can't resolve 'next-themes'
Module not found: Can't resolve 'react-day-picker'
```

재현 조건:
- mono-repo 구조: `mono-repo/design-system/` + `mono-repo/projects/nsq-shadowing/`
- Turbopack `root`를 worktree root(`/mono-repo/.worktrees/nsq-shadowing/`)로 설정
- design-system이 Radix UI 등 peer deps를 import
- 실제 패키지는 `projects/nsq-shadowing/node_modules/`에만 설치

# 실패한 시도

- **프로젝트 node_modules에만 설치**: Turbopack이 design-system 파일을 처리할 때 resolution root가 worktree root이므로 `projects/nsq-shadowing/node_modules`를 찾지 못함
- **tsconfig paths 조정**: `@ds` alias 경로 변경 시도 — Turbopack의 물리적 resolution에는 영향 없음
- **barrel import 최소화 시도**: `design-system/components/index.ts`가 모든 컴포넌트를 re-export하므로 tree-shaking 불가, 미사용 컴포넌트의 peer deps도 모두 필요

# 해결책

Turbopack이 실제로 모듈을 찾는 경로(`worktree-root/node_modules/`)에 심링크를 생성한다.

```bash
# worktree root의 node_modules에 심링크 생성
ln -sf /path/to/nsq-shadowing/node_modules/@radix-ui \
    /mono-repo/.worktrees/nsq-shadowing/node_modules/@radix-ui

ln -sf /path/to/nsq-shadowing/node_modules/next-themes \
    /mono-repo/.worktrees/nsq-shadowing/node_modules/next-themes

ln -sf /path/to/nsq-shadowing/node_modules/react-day-picker \
    /mono-repo/.worktrees/nsq-shadowing/node_modules/react-day-picker

ln -sf /path/to/nsq-shadowing/node_modules/@types \
    /mono-repo/.worktrees/nsq-shadowing/node_modules/@types
```

`next.config.mjs`의 Turbopack 설정:
```js
import path from "node:path";

const nextConfig = {
  turbopack: {
    root: path.join(process.cwd(), "../.."), // worktree root를 가리킴
  },
};
```

# 원인 분석

Turbopack의 `root` 설정은 파일 시스템 감시와 모듈 resolution의 기준점을 결정한다.
`root`가 `worktree-root/`를 가리키면, design-system 파일에서 import되는 모듈은
`worktree-root/node_modules/` 하위에서 먼저 탐색된다.

실제 패키지가 `projects/nsq-shadowing/node_modules/`에 있어도,
Node.js의 표준 module resolution은 `worktree-root/`를 기준으로 올라가므로
`projects/nsq-shadowing/node_modules`는 경로상 "내려가는" 방향이라 탐색되지 않는다.

심링크를 `worktree-root/node_modules/`에 생성하면 Turbopack이 기대하는 위치에서 패키지를 찾을 수 있게 된다.

# 재발 방지

- 새 프로젝트에서 Turbopack + 공유 design-system을 사용할 때, **`turbopack.root`가 가리키는 디렉토리의 `node_modules`에 심링크 스크립트를 셋업 단계에 포함**시킨다.
- `AGENTS.md`에 `npm install` 후 심링크 생성 명령을 명시한다.
- design-system의 peer deps 목록이 변경되면 심링크도 함께 갱신해야 한다.
- `git worktree add`로 새 worktree를 추가할 때마다 심링크를 재생성해야 한다 (심링크는 git에 추가되지 않음).

---

## 파생 시나리오: 폴더 리네임/worktree 제거 후 심링크 파손

### 증상

프로젝트 폴더를 리네임하거나(`nsq-shadowing` → `nsq`) worktree를 제거한 뒤
dev server 실행 시 `module-not-found` 에러가 발생하고, import trace가 아래와 같이 출력된다.

```text
Import traces:
  Client Component Browser:
    ./design-system/components/DatePicker/DatePicker.tsx
    ./design-system/components/index.ts
    ./projects/nsq/src/app/providers.tsx
    ./projects/nsq/src/app/layout.tsx
```

에러 원인: mono-repo root `node_modules/`의 심링크가 이전 경로(삭제된 worktree)를 가리키거나, 아예 누락되어 있음.

### 진단

```bash
for pkg in @radix-ui next-themes react-day-picker; do
  target=$(readlink /path/to/mono-repo/node_modules/$pkg 2>/dev/null)
  [ -e "/path/to/mono-repo/node_modules/$pkg" ] \
    && echo "OK     $pkg" \
    || echo "BROKEN $pkg -> $target"
done
```

### 수정 방법

worktree 없이 `projects/nsq/`에서 직접 실행할 때는 심링크 대상을 `projects/nsq/node_modules/`로 변경한다.

```bash
# projects/nsq/ 에서 실행
NSQ="$(pwd)/node_modules"
MONO="$(pwd)/../../node_modules"

rm "$MONO/@radix-ui"        2>/dev/null; ln -s "$NSQ/@radix-ui"        "$MONO/@radix-ui"
rm "$MONO/next-themes"      2>/dev/null; ln -s "$NSQ/next-themes"      "$MONO/next-themes"
rm "$MONO/react-day-picker" 2>/dev/null; ln -s "$NSQ/react-day-picker" "$MONO/react-day-picker"
```

> `react-day-picker`는 초기 설정 시 mono-repo root에 심링크를 빠뜨리기 쉽다 — 처음부터 목록에 포함시킬 것.
