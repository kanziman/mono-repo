# Design System Tailwind Base Spacing Plan

Date: 2026-05-31  
Status: Completed  
Project: `projects/nsq` consuming shared `design-system/`

## Source Artifact Ledger

| Field | Value |
| --- | --- |
| Artifact path or URL | User screenshot in current conversation: import button rendered as a thin blue pill on NSQ home screen |
| Artifact type | Existing screen screenshot plus live browser computed-style evidence |
| Selected option or screen name | Home import bar, `projects/nsq/src/app/page.tsx` |
| User decision summary | Prevent the same class of Tailwind/design-system mistakes by improving the design system around Tailwind base behavior |
| Implementation scope | Scoped subset: Tailwind spacing scale, design-system Button sizing, NSQ visual regression evidence |
| Non-goals and known deviations | No redesign of NSQ screens, no color/typography token redesign, no package dependency changes |

## Scope Lock

This plan preserves Tailwind's default numeric spacing semantics and moves design-system pixel spacing tokens into a non-numeric namespace so classes like `h-8` reliably mean Tailwind base `2rem`, while design tokens remain available through explicit `ds-*` spacing keys.

## Problem Summary

The import button remained visually compressed because `design-system/tailwind.config.ts` redefined numeric spacing keys:

```ts
spacing: {
  8: 'var(--spacing-8)'
}
```

`design-system/globals.css` defines:

```css
--spacing-8: 8px;
```

As a result, `Button` classes such as `h-8` compiled to `height: 8px` instead of Tailwind's expected `height: 2rem`. The text line-height was larger than the button box, producing a thin blue background with overflowing text.

## Visual Contract

| Requirement | Measurable target |
| --- | --- |
| Home import button height | The `임포트` button on `/` has computed height `32px` for `size="small"` |
| Home import button width | The `임포트` button has computed width at least `72px` on desktop |
| Input/button alignment | URL input and import button are vertically centered in one row with no text overflow |
| Tailwind numeric spacing behavior | `h-8` resolves to `2rem`, `h-10` resolves to `2.5rem`, and `gap-10` resolves to `2.5rem` through Tailwind base |
| Design-system spacing tokens | `ds-8`, `ds-10`, `ds-12`, and other `ds-*` spacing keys resolve to `var(--spacing-*)` |
| Desktop screenshot target | `/` at `1370x768`, screenshot path `projects/nsq/docs/visual-evidence/design-system-tailwind-base/home-desktop.png` |
| Narrow screenshot target | `/` at `390x844`, screenshot path `projects/nsq/docs/visual-evidence/design-system-tailwind-base/home-mobile.png` |
| Theme behavior | Dark theme remains active and semantic colors still render through `design-system/globals.css` |
| Tailwind base key collision audit | `spacing` has no numeric overrides; every remaining base-key override is explicitly allowlisted with rationale |

## Task Breakdown

### Task 1: Add failing Tailwind spacing contract tests

Modify:

- `projects/nsq/src/__tests__/design-system-tailwind-config.test.ts` (create)

Implementation details:

```ts
import { describe, expect, it } from 'vitest'
import resolveConfig from 'tailwindcss/resolveConfig'
import config from '../../../design-system/tailwind.config'

const resolved = resolveConfig(config)

describe('design-system Tailwind spacing contract', () => {
  it('preserves Tailwind base numeric spacing values', () => {
    expect(resolved.theme.spacing['8']).toBe('2rem')
    expect(resolved.theme.spacing['10']).toBe('2.5rem')
    expect(resolved.theme.spacing['12']).toBe('3rem')
  })

  it('exposes design-system pixel spacing through ds-* keys only', () => {
    expect(resolved.theme.spacing['ds-8']).toBe('var(--spacing-8)')
    expect(resolved.theme.spacing['ds-10']).toBe('var(--spacing-10)')
    expect(resolved.theme.spacing['ds-12']).toBe('var(--spacing-12)')
  })
})
```

Add a second describe block in the same file for base-key collision auditing:

```ts
const extend = config.theme?.extend ?? {}

describe('design-system Tailwind base-key collision audit', () => {
  it('does not override numeric Tailwind spacing keys', () => {
    const spacing = extend.spacing ?? {}
    const numericKeys = Object.keys(spacing).filter((key) => /^\d+$/.test(key))
    expect(numericKeys).toEqual([])
  })

  it('documents every intentional Tailwind base-key override', () => {
    const intentionalOverrideKeys = [
      'borderRadius',
      'boxShadow',
      'colors',
      'fontFamily',
      'fontSize',
      'transitionDuration',
      'transitionTimingFunction',
      'zIndex',
    ].sort()
    const auditedKeys = Object.keys(extend)
      .filter((key) => key !== 'spacing' && key !== 'keyframes' && key !== 'animation')
      .sort()
    expect(auditedKeys).toEqual(intentionalOverrideKeys)
  })
})
```

Run and expect failure before implementation:

```bash
cd projects/nsq
npx vitest run src/__tests__/design-system-tailwind-config.test.ts
```

Expected failure before Task 2:

```text
expected 'var(--spacing-8)' to be '2rem'
expected undefined to be 'var(--spacing-8)'
expected [ '0', '2', '4', ... ] to equal []
```

Commit after red test:

```bash
git add projects/nsq/src/__tests__/design-system-tailwind-config.test.ts
git commit -m "test: capture design-system tailwind spacing contract"
```

### Task 2: Restore Tailwind base numeric spacing and add ds-* token namespace

Modify:

- `design-system/tailwind.config.ts`

Implementation details:

Replace the current numeric `extend.spacing` map with explicit design-system keys:

```ts
spacing: {
  'ds-0':  'var(--spacing-0)',
  'ds-2':  'var(--spacing-2)',
  'ds-4':  'var(--spacing-4)',
  'ds-6':  'var(--spacing-6)',
  'ds-8':  'var(--spacing-8)',
  'ds-10': 'var(--spacing-10)',
  'ds-12': 'var(--spacing-12)',
  'ds-16': 'var(--spacing-16)',
  'ds-20': 'var(--spacing-20)',
  'ds-24': 'var(--spacing-24)',
  'ds-32': 'var(--spacing-32)',
  'ds-40': 'var(--spacing-40)',
  'ds-48': 'var(--spacing-48)',
  'ds-56': 'var(--spacing-56)',
  'ds-64': 'var(--spacing-64)',
  'ds-72': 'var(--spacing-72)',
  'ds-80': 'var(--spacing-80)',
}
```

Required constraint:

- Do not define numeric spacing keys under `theme.extend.spacing`.
- Keep `--spacing-*` CSS variables in `design-system/globals.css`; they remain design tokens, but Tailwind utility names must use the `ds-*` namespace when those exact pixel values are needed.

Run:

```bash
cd projects/nsq
npx vitest run src/__tests__/design-system-tailwind-config.test.ts
```

Expected result:

```text
2 tests passed
```

Commit:

```bash
git add design-system/tailwind.config.ts
git commit -m "fix: preserve tailwind base spacing in design system"
```

### Task 2.5: Document intentional Tailwind base-key overrides in code

Modify:

- `design-system/tailwind.config.ts`

Implementation details:

Add a short code comment directly above `theme.extend` that documents the rule:

```ts
// Keep Tailwind's numeric spacing scale intact. Design-system pixel spacing
// lives under ds-* keys so h-8, p-4, gap-10 retain Tailwind base semantics.
// Intentional base-key extensions below are audited by
// projects/nsq/src/__tests__/design-system-tailwind-config.test.ts.
```

Add a local allowlist object or comment that explains why the remaining base-key extensions are intentional:

```ts
// Intentional Tailwind base-key extensions:
// - colors: semantic design tokens
// - fontSize/fontFamily: design typography system
// - borderRadius/boxShadow/zIndex/motion: shared component styling primitives
```

Run:

```bash
cd projects/nsq
npx vitest run src/__tests__/design-system-tailwind-config.test.ts
```

Expected result:

```text
4 tests passed
```

Commit:

```bash
git add design-system/tailwind.config.ts
git commit -m "docs: document tailwind base key override policy"
```

### Task 3: Add browser regression for actual button dimensions

Modify:

- `projects/nsq/e2e/design-system-components.spec.ts` (create)

Implementation details:

```ts
import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const EVIDENCE_DIR = path.resolve(process.cwd(), 'docs', 'visual-evidence', 'design-system-tailwind-base')

test.beforeAll(() => {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
})

test('home import button uses non-compressed small button dimensions', async ({ page }) => {
  await page.setViewportSize({ width: 1370, height: 768 })
  await page.goto('/', { waitUntil: 'networkidle' })
  const button = page.getByRole('button', { name: '임포트' })
  await expect(button).toBeVisible()
  const box = await button.boundingBox()
  expect(box?.height).toBeGreaterThanOrEqual(32)
  expect(box?.width).toBeGreaterThanOrEqual(72)
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'home-desktop.png'), fullPage: false })
})

test('home import row remains aligned on mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'networkidle' })
  const button = page.getByRole('button', { name: '임포트' })
  const input = page.getByPlaceholder('YouTube URL 입력...')
  const buttonBox = await button.boundingBox()
  const inputBox = await input.boundingBox()
  expect(buttonBox?.height).toBeGreaterThanOrEqual(32)
  expect(inputBox?.height).toBeGreaterThanOrEqual(32)
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'home-mobile.png'), fullPage: false })
})
```

Run and expect pass after Task 2:

```bash
cd projects/nsq
npm run seed:visual
npm run dev
npx playwright test e2e/design-system-components.spec.ts
```

Expected rendering after task:

- Home import row shows a normal-height blue `임포트` button.
- Button text is centered inside the blue background.
- The URL input and button are visually aligned on desktop and mobile widths.

Commit:

```bash
git add projects/nsq/e2e/design-system-components.spec.ts projects/nsq/docs/visual-evidence/design-system-tailwind-base
git commit -m "test: add design-system button visual regression"
```

### Task 4: Audit Tailwind base key collisions and update spacing assumptions

Modify after audit:

- `design-system/components/Button/Button.tsx`
- Other `design-system/components/**/*.tsx` files only if a numeric spacing class relied on the old pixel-token behavior and should now use `ds-*`

Audit command:

```bash
rg -n "\\b(h|w|min-h|min-w|max-h|max-w|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y)-(0|2|4|6|8|10|12|16|20|24|32|40|48|56|64|72|80)\\b" design-system/components projects/nsq/src
```

Base key collision audit command:

```bash
node - <<'NODE'
const config = require('./design-system/tailwind.config.ts')
const extend = config.default?.theme?.extend ?? config.theme?.extend ?? {}
console.log(Object.keys(extend).sort())
NODE
```

Expected audited keys:

```text
animation
borderRadius
boxShadow
colors
fontFamily
fontSize
keyframes
spacing
transitionDuration
transitionTimingFunction
zIndex
```

Rules:

- Keep component physical dimensions that match Tailwind base behavior as numeric classes. Example: `h-8` remains `32px`, `h-10` remains `40px`.
- Convert exact design-token spacing intent to `ds-*`. Example: `gap-ds-8` for exactly `8px`.
- Do not change `borderRadius`, `boxShadow`, `fontSize`, `colors`, `zIndex`, or motion keys unless the audit proves an accidental collision. These are currently intentional design-system extensions and must be documented rather than removed.
- For `Button`, keep size classes as:

```ts
if (size === 'small') sizeClasses = iconOnly ? 'w-8 h-8' : 'px-3 h-8 text-label2 gap-1'
else if (size === 'medium') sizeClasses = iconOnly ? 'w-11 h-11' : 'px-4 h-10 text-label1 gap-2'
else if (size === 'large') sizeClasses = iconOnly ? 'w-12 h-12' : 'px-5 h-12 text-headline2 gap-2'
```

Run:

```bash
cd projects/nsq
npm run lint
npm run test
```

Expected result:

```text
All tests pass
```

Commit:

```bash
git add design-system/components projects/nsq/src
git commit -m "refactor: align components with tailwind base spacing"
```

### Task 5: Update design-system documentation and AGENTS guidance

Modify:

- `design-system/DESIGN.md`
- `AGENTS.md`
- `projects/nsq/AGENTS.md`

Required doc changes:

- Add a Tailwind usage rule explaining that numeric Tailwind spacing classes keep Tailwind base semantics.
- Document `ds-*` spacing utilities as the only utility namespace for exact design-system pixel spacing tokens.
- Add a warning that `h-8`, `w-8`, `gap-8`, `p-8` do not mean `spacing[8]=8px`; they mean Tailwind base scale unless `ds-*` is used.
- In AGENTS guidance, require checking rendered component dimensions when changing Tailwind config or shared design-system primitives.

Run:

```bash
cd projects/nsq
npm run lint
npm run test
```

Commit:

```bash
git add design-system/DESIGN.md AGENTS.md projects/nsq/AGENTS.md
git commit -m "docs: document tailwind base spacing contract"
```

### Task 6: Final verification and evidence recording

Run:

```bash
cd projects/nsq
npx vitest run src/__tests__/design-system-tailwind-config.test.ts
npm run test
npm run lint
npm run seed:visual
npx playwright test e2e/design-system-components.spec.ts e2e/visual-parity.spec.ts
```

Manual browser verification:

```bash
cd projects/nsq
npm run dev
```

Open:

```text
http://localhost:3000
```

Record evidence:

- `projects/nsq/docs/visual-evidence/design-system-tailwind-base/home-desktop.png`
- `projects/nsq/docs/visual-evidence/design-system-tailwind-base/home-mobile.png`
- Playwright command output showing all design-system component checks passed

Commit:

```bash
git add projects/nsq/docs/visual-evidence/design-system-tailwind-base
git commit -m "test: record tailwind base spacing visual evidence"
```

## Verification Matrix

| Requirement | Source artifact | Implementation file | Verification method | Evidence |
| --- | --- | --- | --- | --- |
| Tailwind `h-8` resolves to `2rem` | Root-cause browser measurement from current debugging | `design-system/tailwind.config.ts` | `npx vitest run src/__tests__/design-system-tailwind-config.test.ts` | 4 tests passed |
| Design-system spacing remains available | `design-system/DESIGN.md` spacing table | `design-system/tailwind.config.ts` | Vitest asserts `ds-8`, `ds-10`, `ds-12` values | 4 tests passed |
| Tailwind base-key collisions are audited | User request to explicitly strengthen base key collision audit | `projects/nsq/src/__tests__/design-system-tailwind-config.test.ts`, `design-system/tailwind.config.ts` | Vitest asserts no numeric spacing overrides and exact intentional override allowlist | 4 tests passed |
| Import button height is at least 32px | User screenshot showing compressed button | `design-system/components/Button/Button.tsx`, `projects/nsq/src/app/page.tsx` | Playwright bounding box check at 1370x768 | `docs/visual-evidence/design-system-tailwind-base/home-desktop.png`; measured `72x40` |
| Import button remains aligned on mobile | Home import bar existing screen | `projects/nsq/src/app/page.tsx` | Playwright screenshot at 390x844 | `docs/visual-evidence/design-system-tailwind-base/home-mobile.png` |
| Existing Home/Player UI does not regress | Existing visual parity suite | `projects/nsq/e2e/visual-parity.spec.ts` | `npx playwright test e2e/visual-parity.spec.ts` | 4 visual parity tests passed; screenshots in `docs/visual-evidence/nsq-ui-visual-parity/` |
| Documentation prevents repeat mistakes | Current root cause and AGENTS design-system rule | `design-system/DESIGN.md`, `AGENTS.md`, `projects/nsq/AGENTS.md` | Review docs contain Tailwind base and `ds-*` rules | Docs updated |

## Checklist JSON Mapping

| Checklist task id | Plan section |
| --- | --- |
| `task-1` | Add failing Tailwind spacing contract tests |
| `task-2` | Restore Tailwind base numeric spacing and add ds-* token namespace |
| `task-2-5` | Document intentional Tailwind base-key overrides in code |
| `task-3` | Add browser regression for actual button dimensions |
| `task-4` | Audit Tailwind base key collisions and update spacing assumptions |
| `task-5` | Update design-system documentation and AGENTS guidance |
| `task-6` | Final verification and evidence recording |

## Out-of-Scope and Intentional Deviations

- This plan does not redesign NSQ Home or Player layouts.
- This plan does not change color, typography, radius, shadow, z-index, or motion token values.
- This plan does not add a new UI library or change package dependencies.
- This plan does not migrate every project in the monorepo unless the audit finds direct usage of shared design-system spacing assumptions.
