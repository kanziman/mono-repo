# NSQ Shadowing App — Implementation Plan

Date: 2026-05-30  
Source Design: `projects/fervent/docs/design-docs/nsq-shadowing-design.md`  
App Root: `projects/nsq-shadowing/`

---

## 개요

YouTube "No Stupid Questions" 팟캐스트 영상 기반 영어 쉐도잉 로컬 웹앱.  
Next.js 14 (App Router) + TypeScript + TailwindCSS 스택으로 구현.

---

## Task 1: 프로젝트 부트스트랩

**목표**: Next.js 14 앱 초기화, 의존성 설치, 기본 설정 완료

### Step 1: 테스트 파일 작성 (실패 예정)

`projects/nsq-shadowing/src/__tests__/setup.test.ts` 생성:

```ts
import { describe, it, expect } from 'vitest'

describe('Project setup', () => {
  it('TypeScript can import path module', () => {
    const path = require('path')
    expect(typeof path.resolve).toBe('function')
  })
  it('NODE_ENV is defined', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })
})
```

### Step 2: 테스트 실행 (실패 확인)

```bash
cd projects/nsq-shadowing && npx vitest run src/__tests__/setup.test.ts
# Expected: cannot find module / project not initialized yet
```

### Step 3: 구현

```bash
# Next.js 14 앱 생성 (App Router, TypeScript, TailwindCSS, ESLint 포함)
cd projects && npx create-next-app@14 nsq-shadowing \
  --typescript --tailwind --eslint --app --no-src-dir=false \
  --import-alias "@/*"

cd nsq-shadowing

# 추가 의존성
npm install next-themes

# 개발 의존성 (테스트)
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom

# .env.local 템플릿
cat > .env.local << 'EOF'
OPENROUTER_API_KEY=your-openrouter-api-key-here
TRANSLATION_MODEL=google/gemini-flash-1.5
TUTOR_MODEL=anthropic/claude-haiku-4-5
EOF
```

`projects/nsq-shadowing/vitest.config.ts` 생성:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/vitest-setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

`projects/nsq-shadowing/src/__tests__/vitest-setup.ts` 생성:

```ts
import '@testing-library/jest-dom'
```

Pretendard 폰트 설정 — `projects/nsq-shadowing/src/app/layout.tsx` 수정:

```tsx
import localFont from 'next/font/local'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const pretendard = localFont({
  src: '../fonts/PretendardVariable.woff2',
  display: 'swap',
  variable: '--font-pretendard',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${pretendard.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

Pretendard 폰트 파일 다운로드:

```bash
mkdir -p src/fonts
curl -L "https://github.com/orioncactus/pretendard/releases/latest/download/PretendardVariable.woff2" \
  -o src/fonts/PretendardVariable.woff2
```

`projects/nsq-shadowing/tailwind.config.ts` 수정 — fontFamily 추가:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-pretendard)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
```

### Step 4: 테스트 실행 (통과 확인)

```bash
cd projects/nsq-shadowing && npx vitest run src/__tests__/setup.test.ts
# Expected: 2 tests passed
```

### Step 5: Git 커밋

```bash
git add projects/nsq-shadowing/
git commit -m "chore: bootstrap nsq-shadowing Next.js 14 app with TailwindCSS and vitest"
```

---

## Task 2: 타입 정의 & 유효성 검증 유틸리티

**목표**: 핵심 타입 인터페이스와 보안 검증 함수(videoId 화이트리스트 + Path Traversal 방지) 구현

### Step 1: 테스트 파일 작성

`projects/nsq-shadowing/src/__tests__/validate.test.ts` 생성:

```ts
import { describe, it, expect } from 'vitest'
import { validateVideoId, getEpisodePath } from '@/lib/validate'

describe('validateVideoId', () => {
  it('accepts valid 11-char alphanumeric IDs', () => {
    expect(validateVideoId('dQw4w9WgXcQ')).toBe(true)
    expect(validateVideoId('abcdefghijk')).toBe(true)
    expect(validateVideoId('ABCDE12345_')).toBe(true)
    expect(validateVideoId('test-id1234')).toBe(true)
  })
  it('rejects path traversal attempts', () => {
    expect(validateVideoId('../etc/passwd')).toBe(false)
    expect(validateVideoId('../../secret')).toBe(false)
    expect(validateVideoId('abc/def/ghi')).toBe(false)
  })
  it('rejects IDs that are not exactly 11 chars', () => {
    expect(validateVideoId('short')).toBe(false)
    expect(validateVideoId('toolongvideoidstring')).toBe(false)
    expect(validateVideoId('')).toBe(false)
  })
  it('rejects IDs with special characters', () => {
    expect(validateVideoId('abc!@#$%^&*')).toBe(false)
    expect(validateVideoId('abc def ghij')).toBe(false)
  })
})

describe('getEpisodePath', () => {
  it('returns path inside ~/.shadowing/episodes/', () => {
    const p = getEpisodePath('dQw4w9WgXcQ')
    expect(p).toContain('.shadowing/episodes/dQw4w9WgXcQ')
  })
  it('throws on invalid videoId', () => {
    expect(() => getEpisodePath('../evil')).toThrow('Invalid videoId')
  })
})
```

### Step 2: 테스트 실행 (실패 확인)

```bash
cd projects/nsq-shadowing && npx vitest run src/__tests__/validate.test.ts
# Expected: Cannot find module '@/lib/validate'
```

### Step 3: 구현

`projects/nsq-shadowing/src/types/index.ts` 생성:

```ts
export interface Segment {
  index: number
  start: number       // seconds
  end: number         // seconds
  text: string        // 영어 원문
  translation: string // 한국어 번역
}

export interface EpisodeMeta {
  videoId: string
  title: string
  durationSec: number
  thumbnailUrl: string  // /api/thumbnail/[videoId]
  importedAt: string    // ISO date string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export type Persona = 'angela' | 'mike' | 'general'

export type ImportStep = 'download' | 'subtitle' | 'translate'

export interface ImportProgress {
  step: ImportStep
  progress: number
  done: boolean
  error?: string
}

export interface PositionState {
  segmentIndex: number
  offset: number
  importedAt: string
}
```

`projects/nsq-shadowing/src/lib/validate.ts` 생성:

```ts
import path from 'path'
import os from 'os'

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/
const SHADOWING_BASE = path.join(os.homedir(), '.shadowing', 'episodes')

export function validateVideoId(videoId: string): boolean {
  return VIDEO_ID_REGEX.test(videoId)
}

export function getEpisodePath(videoId: string): string {
  if (!validateVideoId(videoId)) {
    throw new Error('Invalid videoId')
  }
  const resolved = path.resolve(SHADOWING_BASE, videoId)
  if (!resolved.startsWith(SHADOWING_BASE)) {
    throw new Error('Invalid videoId: path traversal detected')
  }
  return resolved
}

export function getFilePath(videoId: string, filename: string): string {
  return path.join(getEpisodePath(videoId), filename)
}
```

`projects/nsq-shadowing/src/lib/paths.ts` 생성:

```ts
import path from 'path'
import os from 'os'
import fs from 'fs'

export const SHADOWING_BASE = path.join(os.homedir(), '.shadowing')
export const EPISODES_BASE = path.join(SHADOWING_BASE, 'episodes')

export function ensureEpisodeDir(videoId: string): string {
  const dir = path.join(EPISODES_BASE, videoId)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}
```

### Step 4: 테스트 실행 (통과 확인)

```bash
cd projects/nsq-shadowing && npx vitest run src/__tests__/validate.test.ts
# Expected: 8 tests passed
```

### Step 5: Git 커밋

```bash
git add projects/nsq-shadowing/src/types/ projects/nsq-shadowing/src/lib/validate.ts projects/nsq-shadowing/src/lib/paths.ts
git commit -m "feat: add core type definitions and videoId validation with path traversal protection"
```

---

## Task 3: yt-dlp 통합 & VTT 파서

**목표**: yt-dlp CLI 래퍼(커맨드 인젝션 방지) 및 VTT → Segment[] 변환 파서 구현

### Step 1: 테스트 파일 작성

`projects/nsq-shadowing/src/__tests__/vtt.test.ts` 생성:

```ts
import { describe, it, expect } from 'vitest'
import { vttToSegments } from '@/lib/vtt'

const SAMPLE_VTT = `WEBVTT
Kind: captions
Language: en

00:00:01.000 --> 00:00:04.500
<c.colorCCCCCC>Hello, I'm Angela Duckworth.</c>

00:00:04.500 --> 00:00:08.000
<c.colorCCCCCC>And I'm Mike Maughan.</c>

00:00:08.000 --> 00:00:08.000
<c.colorCCCCCC>And I'm Mike Maughan.</c>

00:00:10.000 --> 00:00:15.500
<c.colorCCCCCC>Today we&#39;re talking about grit &amp; resilience.</c>
`

describe('vttToSegments', () => {
  it('parses timestamps to seconds', () => {
    const segs = vttToSegments(SAMPLE_VTT)
    expect(segs[0].start).toBe(1)
    expect(segs[0].end).toBe(4.5)
  })
  it('strips HTML tags from text', () => {
    const segs = vttToSegments(SAMPLE_VTT)
    expect(segs[0].text).toBe("Hello, I'm Angela Duckworth.")
    expect(segs[0].text).not.toContain('<c')
  })
  it('decodes HTML entities', () => {
    const segs = vttToSegments(SAMPLE_VTT)
    const lastSeg = segs[segs.length - 1]
    expect(lastSeg.text).toContain("we're")
    expect(lastSeg.text).toContain('&')
  })
  it('deduplicates consecutive identical segments', () => {
    const segs = vttToSegments(SAMPLE_VTT)
    // "And I'm Mike Maughan." appears twice with same text but only once after dedup
    const mikeCount = segs.filter(s => s.text === "And I'm Mike Maughan.").length
    expect(mikeCount).toBe(1)
  })
  it('assigns sequential indexes', () => {
    const segs = vttToSegments(SAMPLE_VTT)
    segs.forEach((s, i) => expect(s.index).toBe(i))
  })
  it('initializes translation as empty string', () => {
    const segs = vttToSegments(SAMPLE_VTT)
    segs.forEach(s => expect(s.translation).toBe(''))
  })
})
```

### Step 2: 테스트 실행 (실패 확인)

```bash
cd projects/nsq-shadowing && npx vitest run src/__tests__/vtt.test.ts
# Expected: Cannot find module '@/lib/vtt'
```

### Step 3: 구현

`projects/nsq-shadowing/src/lib/vtt.ts` 생성:

```ts
import { Segment } from '@/types'

function parseTimestamp(ts: string): number {
  const parts = ts.trim().split(':')
  if (parts.length === 3) {
    const [h, m, s] = parts
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s)
  }
  const [m, s] = parts
  return parseInt(m) * 60 + parseFloat(s)
}

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, '')
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

export function vttToSegments(vtt: string): Segment[] {
  const blocks = vtt.split(/\n\n+/).filter(Boolean)
  const raw: Omit<Segment, 'index' | 'translation'>[] = []

  for (const block of blocks) {
    const lines = block.split('\n').filter(Boolean)
    const timeLine = lines.find(l => l.includes('-->'))
    if (!timeLine) continue

    const [startStr, endStr] = timeLine.split('-->').map(s => s.trim())
    const textLines = lines.filter(l => !l.includes('-->') && !/^WEBVTT|^Kind:|^Language:/.test(l))
    const text = decodeHtmlEntities(stripHtmlTags(textLines.join(' '))).trim()

    if (!text) continue

    raw.push({ start: parseTimestamp(startStr), end: parseTimestamp(endStr), text })
  }

  // Deduplicate consecutive identical text
  const deduped = raw.filter((seg, i) => i === 0 || seg.text !== raw[i - 1].text)

  return deduped.map((seg, index) => ({ ...seg, index, translation: '' }))
}
```

`projects/nsq-shadowing/src/lib/ytdlp.ts` 생성:

```ts
import { spawn } from 'child_process'
import path from 'path'

export interface YtDlpResult {
  audioPath: string
  vttContent: string
  title: string
}

function runProcess(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'pipe' })
    let stderr = ''
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} exited with code ${code}: ${stderr}`))
    })
  })
}

export async function downloadAudio(videoUrl: string, outputDir: string): Promise<void> {
  const outputTemplate = path.join(outputDir, 'audio.%(ext)s')
  // URL은 반드시 별도 인수로 전달 — shell 문자열 삽입 금지
  await runProcess('yt-dlp', [
    '--extract-audio',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '-o', outputTemplate,
    videoUrl,
  ])
}

export async function downloadSubtitle(videoUrl: string, outputDir: string): Promise<string> {
  // 영어 수동 자막 우선, 없으면 자동 자막
  const subtitleBase = path.join(outputDir, 'subtitle')
  try {
    await runProcess('yt-dlp', [
      '--write-subs',
      '--sub-lang', 'en',
      '--skip-download',
      '-o', subtitleBase,
      videoUrl,
    ])
  } catch {
    await runProcess('yt-dlp', [
      '--write-auto-subs',
      '--sub-lang', 'en',
      '--skip-download',
      '-o', subtitleBase,
      videoUrl,
    ])
  }

  const fs = await import('fs/promises')
  const files = await fs.readdir(outputDir)
  const vttFile = files.find(f => f.startsWith('subtitle') && f.endsWith('.vtt'))
  if (!vttFile) throw new Error('No English subtitle found')
  return fs.readFile(path.join(outputDir, vttFile), 'utf-8')
}

export async function getVideoTitle(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let out = ''
    const proc = spawn('yt-dlp', ['--get-title', '--no-playlist', videoUrl], { stdio: 'pipe' })
    proc.stdout.on('data', (d: Buffer) => { out += d.toString() })
    proc.on('close', code => {
      if (code === 0) resolve(out.trim())
      else reject(new Error('Failed to get video title'))
    })
  })
}
```

### Step 4: 테스트 실행 (통과 확인)

```bash
cd projects/nsq-shadowing && npx vitest run src/__tests__/vtt.test.ts
# Expected: 6 tests passed
```

### Step 5: Git 커밋

```bash
git add projects/nsq-shadowing/src/lib/vtt.ts projects/nsq-shadowing/src/lib/ytdlp.ts
git commit -m "feat: add VTT parser and yt-dlp wrapper with command injection protection"
```

---

## Task 4: 번역 파이프라인

**목표**: 세그먼트를 50개 청크 단위로 OpenRouter API에 배치 번역, 체크포인트 저장/복원

### Step 1: 테스트 파일 작성

`projects/nsq-shadowing/src/__tests__/translate.test.ts` 생성:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { chunkSegments, buildTranslationPrompt } from '@/lib/translate'
import type { Segment } from '@/types'

function makeSegments(count: number): Segment[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i, start: i, end: i + 1, text: `Sentence ${i + 1}.`, translation: '',
  }))
}

describe('chunkSegments', () => {
  it('splits 120 segments into 3 chunks of 50/50/20', () => {
    const segs = makeSegments(120)
    const chunks = chunkSegments(segs, 50)
    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toHaveLength(50)
    expect(chunks[1]).toHaveLength(50)
    expect(chunks[2]).toHaveLength(20)
  })
  it('returns single chunk when segments <= chunkSize', () => {
    const segs = makeSegments(30)
    const chunks = chunkSegments(segs, 50)
    expect(chunks).toHaveLength(1)
  })
})

describe('buildTranslationPrompt', () => {
  it('includes all segment texts in the prompt', () => {
    const segs = makeSegments(3)
    const prompt = buildTranslationPrompt(segs)
    expect(prompt).toContain('Sentence 1.')
    expect(prompt).toContain('Sentence 2.')
    expect(prompt).toContain('Sentence 3.')
  })
  it('requests JSON array output', () => {
    const segs = makeSegments(2)
    const prompt = buildTranslationPrompt(segs)
    expect(prompt.toLowerCase()).toContain('json')
  })
})
```

### Step 2: 테스트 실행 (실패 확인)

```bash
cd projects/nsq-shadowing && npx vitest run src/__tests__/translate.test.ts
# Expected: Cannot find module '@/lib/translate'
```

### Step 3: 구현

`projects/nsq-shadowing/src/lib/translate.ts` 생성:

```ts
import fs from 'fs'
import path from 'path'
import type { Segment } from '@/types'

export function chunkSegments(segments: Segment[], size = 50): Segment[][] {
  const chunks: Segment[][] = []
  for (let i = 0; i < segments.length; i += size) {
    chunks.push(segments.slice(i, i + size))
  }
  return chunks
}

export function buildTranslationPrompt(segments: Segment[]): string {
  const numbered = segments.map((s, i) => `${i + 1}. ${s.text}`).join('\n')
  return `다음 영어 문장들을 자연스러운 한국어로 번역하세요.
반드시 JSON 배열 형식으로만 응답하세요. 예: ["번역1", "번역2", ...]
번역 개수는 정확히 입력 개수(${segments.length}개)와 일치해야 합니다.

${numbered}`
}

async function callOpenRouter(prompt: string): Promise<string[]> {
  const model = process.env.TRANSLATION_MODEL ?? 'google/gemini-flash-1.5'
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  })
  if (!resp.ok) throw new Error(`OpenRouter error: ${resp.status}`)
  const json = await resp.json()
  const text: string = json.choices[0].message.content
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Translation response is not a JSON array')
  return JSON.parse(match[0]) as string[]
}

export async function translateChunk(
  segments: Segment[],
  chunkIndex: number,
  checkpointDir: string
): Promise<string[]> {
  const checkpointPath = path.join(checkpointDir, `translate_chunk_${chunkIndex}`)

  // 이미 완료된 청크는 스킵
  if (fs.existsSync(checkpointPath)) {
    return JSON.parse(fs.readFileSync(checkpointPath, 'utf-8'))
  }

  const prompt = buildTranslationPrompt(segments)
  let translations: string[]

  try {
    translations = await callOpenRouter(prompt)
  } catch {
    // 1회 재시도
    try {
      translations = await callOpenRouter(prompt)
    } catch {
      translations = segments.map(() => '')
    }
  }

  // 개수 불일치 시 빈 문자열로 패딩
  if (translations.length !== segments.length) {
    while (translations.length < segments.length) translations.push('')
    translations = translations.slice(0, segments.length)
  }

  fs.writeFileSync(checkpointPath, JSON.stringify(translations))
  return translations
}

export async function translateAllSegments(
  segments: Segment[],
  checkpointDir: string,
  onProgress: (chunkIndex: number, total: number) => void
): Promise<Segment[]> {
  const chunks = chunkSegments(segments, 50)
  const translated = [...segments]

  for (let i = 0; i < chunks.length; i++) {
    const translations = await translateChunk(chunks[i], i, checkpointDir)
    chunks[i].forEach((seg, j) => {
      translated[seg.index] = { ...translated[seg.index], translation: translations[j] }
    })
    onProgress(i + 1, chunks.length)
  }

  // 체크포인트 파일 정리
  for (let i = 0; i < chunks.length; i++) {
    const cp = path.join(checkpointDir, `translate_chunk_${i}`)
    if (fs.existsSync(cp)) fs.unlinkSync(cp)
  }

  return translated
}
```

### Step 4: 테스트 실행 (통과 확인)

```bash
cd projects/nsq-shadowing && npx vitest run src/__tests__/translate.test.ts
# Expected: 4 tests passed
```

### Step 5: Git 커밋

```bash
git add projects/nsq-shadowing/src/lib/translate.ts
git commit -m "feat: add chunked translation pipeline with OpenRouter API and checkpoint resume"
```

---

## Task 5: API — /api/import (SSE 스트림)

**목표**: videoId 임포트 엔드포인트. nodejs 런타임 선언, 중복 실행 Set lock, SSE 스트림 응답

### Step 1: 테스트 파일 작성

`projects/nsq-shadowing/src/__tests__/api-import.test.ts` 생성:

```ts
import { describe, it, expect } from 'vitest'
import { validateVideoId } from '@/lib/validate'

describe('/api/import input validation', () => {
  it('accepts valid YouTube video IDs', () => {
    expect(validateVideoId('dQw4w9WgXcQ')).toBe(true)
  })
  it('rejects invalid IDs before hitting yt-dlp', () => {
    expect(validateVideoId('../../evil')).toBe(false)
    expect(validateVideoId('')).toBe(false)
  })
})
```

### Step 2: 테스트 실행 (실패 확인)

```bash
cd projects/nsq-shadowing && npx vitest run src/__tests__/api-import.test.ts
# Expected: tests pass once validate.ts is in place (already done in Task 2)
```

### Step 3: 구현

`projects/nsq-shadowing/src/app/api/import/route.ts` 생성:

```ts
export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs'
import { validateVideoId, getEpisodePath } from '@/lib/validate'
import { ensureEpisodeDir } from '@/lib/paths'
import { downloadAudio, downloadSubtitle, getVideoTitle } from '@/lib/ytdlp'
import { vttToSegments } from '@/lib/vtt'
import { translateAllSegments } from '@/lib/translate'
import type { EpisodeMeta } from '@/types'

// 중복 임포트 방지 — 서버 메모리 Set lock
const importing = new Set<string>()

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { videoId } = body as { videoId?: string }

  if (!videoId || !validateVideoId(videoId)) {
    return new Response(JSON.stringify({ error: 'Invalid videoId' }), { status: 400 })
  }

  if (importing.has(videoId)) {
    return new Response(JSON.stringify({ error: 'Already importing' }), { status: 409 })
  }

  importing.add(videoId)
  const episodeDir = ensureEpisodeDir(videoId)
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(new TextEncoder().encode(sseEvent(data)))

      try {
        // Step 1: Download audio
        send({ step: 'download', progress: 0, done: false })
        await downloadAudio(videoUrl, episodeDir)
        send({ step: 'download', progress: 100, done: false })

        // Step 2: Download subtitle
        send({ step: 'subtitle', progress: 0, done: false })
        const title = await getVideoTitle(videoUrl)
        const vttContent = await downloadSubtitle(videoUrl, episodeDir)
        const segments = vttToSegments(vttContent)
        send({ step: 'subtitle', progress: 100, done: false })

        // Step 3: Translate
        send({ step: 'translate', progress: 0, done: false })
        const chunks = Math.ceil(segments.length / 50)
        const translated = await translateAllSegments(segments, episodeDir, (done, total) => {
          send({ step: 'translate', progress: Math.round((done / total) * 100), done: false })
        })

        // Write segments.json
        fs.writeFileSync(path.join(episodeDir, 'segments.json'), JSON.stringify(translated))

        // Write meta.json
        const meta: EpisodeMeta = {
          videoId,
          title,
          durationSec: translated[translated.length - 1]?.end ?? 0,
          thumbnailUrl: `/api/thumbnail/${videoId}`,
          importedAt: new Date().toISOString(),
        }
        fs.writeFileSync(path.join(episodeDir, 'meta.json'), JSON.stringify(meta))

        send({ step: 'translate', progress: 100, done: true })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        send({ step: 'download', progress: 0, done: true, error: msg })
      } finally {
        importing.delete(videoId)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

### Step 4: 테스트 실행 (통과 확인)

```bash
cd projects/nsq-shadowing && npx vitest run src/__tests__/api-import.test.ts
# Expected: 2 tests passed
```

### Step 5: Git 커밋

```bash
git add projects/nsq-shadowing/src/app/api/import/
git commit -m "feat: add /api/import SSE endpoint with nodejs runtime and duplicate lock"
```

---

## Task 6: API — 에피소드 목록 & 상세

**목표**: `GET /api/episodes` (목록), `GET /api/episodes/[videoId]` (상세 + 세그먼트) 구현

### Step 1: 구현

`projects/nsq-shadowing/src/app/api/episodes/route.ts` 생성:

```ts
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { EPISODES_BASE } from '@/lib/paths'
import type { EpisodeMeta } from '@/types'

export async function GET() {
  if (!fs.existsSync(EPISODES_BASE)) {
    return NextResponse.json([])
  }
  const dirs = fs.readdirSync(EPISODES_BASE, { withFileTypes: true })
    .filter(d => d.isDirectory())

  const metas: EpisodeMeta[] = []
  for (const dir of dirs) {
    const metaPath = path.join(EPISODES_BASE, dir.name, 'meta.json')
    if (fs.existsSync(metaPath)) {
      metas.push(JSON.parse(fs.readFileSync(metaPath, 'utf-8')))
    }
  }
  return NextResponse.json(metas)
}
```

`projects/nsq-shadowing/src/app/api/episodes/[videoId]/route.ts` 생성:

```ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { validateVideoId } from '@/lib/validate'
import { EPISODES_BASE } from '@/lib/paths'

export async function GET(
  _req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const { videoId } = params
  if (!validateVideoId(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId' }, { status: 400 })
  }

  const episodeDir = path.join(EPISODES_BASE, videoId)
  const metaPath = path.join(episodeDir, 'meta.json')
  const segmentsPath = path.join(episodeDir, 'segments.json')

  if (!fs.existsSync(metaPath) || !fs.existsSync(segmentsPath)) {
    return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
  const segments = JSON.parse(fs.readFileSync(segmentsPath, 'utf-8'))
  return NextResponse.json({ meta, segments })
}
```

### Step 2: 수동 검증

```bash
cd projects/nsq-shadowing && npm run dev
# curl http://localhost:3000/api/episodes
# Expected: []  (빈 배열, 에피소드 없을 때)
```

### Step 3: Git 커밋

```bash
git add projects/nsq-shadowing/src/app/api/episodes/
git commit -m "feat: add GET /api/episodes and /api/episodes/[videoId] endpoints"
```

---

## Task 7: API — 오디오 스트리밍 (Range Request)

**목표**: HTTP Range 헤더 파싱 후 `fs.createReadStream({ start, end })` 로 206 Partial Content 응답

### Step 1: 테스트 파일 작성

`projects/nsq-shadowing/src/__tests__/audio-range.test.ts` 생성:

```ts
import { describe, it, expect } from 'vitest'
import { parseRangeHeader } from '@/lib/audio'

describe('parseRangeHeader', () => {
  it('parses bytes=0-999 correctly', () => {
    const result = parseRangeHeader('bytes=0-999', 5000)
    expect(result).toEqual({ start: 0, end: 999 })
  })
  it('parses open-ended range bytes=500-', () => {
    const result = parseRangeHeader('bytes=500-', 5000)
    expect(result).toEqual({ start: 500, end: 4999 })
  })
  it('returns null for invalid range header', () => {
    expect(parseRangeHeader(null, 5000)).toBeNull()
    expect(parseRangeHeader('invalid', 5000)).toBeNull()
  })
  it('clamps end to fileSize - 1', () => {
    const result = parseRangeHeader('bytes=0-99999', 5000)
    expect(result!.end).toBe(4999)
  })
})
```

### Step 2: 테스트 실행 (실패 확인)

```bash
cd projects/nsq-shadowing && npx vitest run src/__tests__/audio-range.test.ts
# Expected: Cannot find module '@/lib/audio'
```

### Step 3: 구현

`projects/nsq-shadowing/src/lib/audio.ts` 생성:

```ts
export interface RangeResult {
  start: number
  end: number
}

export function parseRangeHeader(range: string | null, fileSize: number): RangeResult | null {
  if (!range || !range.startsWith('bytes=')) return null
  const [startStr, endStr] = range.replace('bytes=', '').split('-')
  const start = parseInt(startStr, 10)
  if (isNaN(start)) return null
  const end = endStr ? Math.min(parseInt(endStr, 10), fileSize - 1) : fileSize - 1
  if (isNaN(end) || start > end) return null
  return { start, end }
}
```

`projects/nsq-shadowing/src/app/api/audio/[videoId]/route.ts` 생성:

```ts
export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { validateVideoId } from '@/lib/validate'
import { EPISODES_BASE } from '@/lib/paths'
import { parseRangeHeader } from '@/lib/audio'

export async function GET(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const { videoId } = params
  if (!validateVideoId(videoId)) {
    return new Response('Invalid videoId', { status: 400 })
  }

  const audioPath = path.join(EPISODES_BASE, videoId, 'audio.mp3')
  if (!fs.existsSync(audioPath)) {
    return new Response('Audio not found', { status: 404 })
  }

  const stat = fs.statSync(audioPath)
  const fileSize = stat.size
  const rangeHeader = req.headers.get('range')
  const range = parseRangeHeader(rangeHeader, fileSize)

  if (range) {
    const { start, end } = range
    const chunkSize = end - start + 1
    const fileStream = fs.createReadStream(audioPath, { start, end })
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', chunk => controller.enqueue(chunk))
        fileStream.on('end', () => controller.close())
        fileStream.on('error', err => controller.error(err))
      },
    })
    return new Response(webStream, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': 'audio/mpeg',
      },
    })
  }

  const fileStream = fs.createReadStream(audioPath)
  const webStream = new ReadableStream({
    start(controller) {
      fileStream.on('data', chunk => controller.enqueue(chunk))
      fileStream.on('end', () => controller.close())
      fileStream.on('error', err => controller.error(err))
    },
  })
  return new Response(webStream, {
    status: 200,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Length': String(fileSize),
      'Content-Type': 'audio/mpeg',
    },
  })
}
```

### Step 4: 테스트 실행 (통과 확인)

```bash
cd projects/nsq-shadowing && npx vitest run src/__tests__/audio-range.test.ts
# Expected: 4 tests passed
```

### Step 5: Git 커밋

```bash
git add projects/nsq-shadowing/src/lib/audio.ts projects/nsq-shadowing/src/app/api/audio/
git commit -m "feat: add /api/audio/[videoId] with HTTP Range Request support for audio seeking"
```

---

## Task 8: API — 썸네일 & AI 튜터 채팅

**목표**: 썸네일 정적 서빙 + OpenRouter 스트리밍 튜터 엔드포인트

### Step 1: 구현

`projects/nsq-shadowing/src/app/api/thumbnail/[videoId]/route.ts` 생성:

```ts
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { validateVideoId } from '@/lib/validate'
import { EPISODES_BASE } from '@/lib/paths'

export async function GET(
  _req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const { videoId } = params
  if (!validateVideoId(videoId)) return new Response('Invalid videoId', { status: 400 })

  const thumbPath = path.join(EPISODES_BASE, videoId, 'thumbnail.jpg')
  if (!fs.existsSync(thumbPath)) return new Response('Not found', { status: 404 })

  const data = fs.readFileSync(thumbPath)
  return new Response(data, { headers: { 'Content-Type': 'image/jpeg' } })
}
```

`projects/nsq-shadowing/src/lib/tutor.ts` 생성:

```ts
import type { Message, Persona, Segment } from '@/types'

const PERSONA_PROMPTS: Record<Persona, string> = {
  angela: `You are Angela Duckworth Bot — a warm, intellectually curious tutor channeling Angela Duckworth's research on grit and perseverance. 
Help the user understand English expressions from the No Stupid Questions podcast. Be encouraging and insightful.`,
  mike: `You are Mike Maughan Bot — conversational, witty, and practical tutor. 
Help the user practice English by explaining expressions, cultural context, and conversational nuance from the podcast.`,
  general: `You are a friendly English language tutor specializing in podcast content. 
Help the user understand, practice, and improve their English speaking skills.`,
}

export function buildSystemPrompt(
  persona: Persona,
  episodeTitle: string,
  allSegments: Segment[],
  currentSegment?: Segment
): string {
  const allText = allSegments.map(s => s.text).join(' ')
  const context = currentSegment
    ? `\n\nCurrent segment the user is practicing:\n"${currentSegment.text}"`
    : ''

  return `${PERSONA_PROMPTS[persona]}

Episode: "${episodeTitle}"
Full transcript context:
${allText.slice(0, 3000)}${context}

Respond in Korean unless the user writes in English. Keep responses concise and helpful.`
}
```

`projects/nsq-shadowing/src/app/api/tutor/chat/route.ts` 생성:

```ts
export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { validateVideoId } from '@/lib/validate'
import { EPISODES_BASE } from '@/lib/paths'
import { buildSystemPrompt } from '@/lib/tutor'
import type { Message, Persona, Segment } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { videoId, persona, messages, currentSegment } = body as {
    videoId: string
    persona: Persona
    messages: Message[]
    currentSegment?: Segment
  }

  if (!validateVideoId(videoId)) {
    return new Response(JSON.stringify({ error: 'Invalid videoId' }), { status: 400 })
  }

  const metaPath = path.join(EPISODES_BASE, videoId, 'meta.json')
  const segmentsPath = path.join(EPISODES_BASE, videoId, 'segments.json')
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
  const allSegments: Segment[] = JSON.parse(fs.readFileSync(segmentsPath, 'utf-8'))

  const systemPrompt = buildSystemPrompt(persona, meta.title, allSegments, currentSegment)
  const model = process.env.TUTOR_MODEL ?? 'anthropic/claude-haiku-4-5'

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!resp.ok) {
    return new Response(JSON.stringify({ error: 'AI tutor error' }), { status: 500 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()
      const encode = (data: object) =>
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`))

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
          try {
            const json = JSON.parse(line.replace('data: ', ''))
            const delta = json.choices?.[0]?.delta?.content ?? ''
            if (delta) encode({ delta, done: false })
          } catch { /* skip malformed lines */ }
        }
      }
      encode({ delta: '', done: true })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
```

### Step 2: Git 커밋

```bash
git add projects/nsq-shadowing/src/app/api/thumbnail/ projects/nsq-shadowing/src/app/api/tutor/ projects/nsq-shadowing/src/lib/tutor.ts
git commit -m "feat: add thumbnail serving and AI tutor SSE endpoint with persona system prompts"
```

---

## Task 9: 상태 관리 — useReducer + Context

**목표**: 외부 라이브러리 없이 Player 전역 상태 관리 구현 (Zustand 미사용)

### Step 1: 구현

`projects/nsq-shadowing/src/context/PlayerContext.tsx` 생성:

```tsx
'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import type { Segment, Persona } from '@/types'

type PlayerMode = 'immersion' | 'sentence'

interface PlayerState {
  segments: Segment[]
  currentIndex: number
  isPlaying: boolean
  mode: PlayerMode
  persona: Persona
  showTranslation: boolean[]  // per-segment translation visibility
}

type PlayerAction =
  | { type: 'SET_SEGMENTS'; segments: Segment[] }
  | { type: 'SET_INDEX'; index: number }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'TOGGLE_MODE' }
  | { type: 'TOGGLE_TRANSLATION'; index: number }
  | { type: 'SET_PERSONA'; persona: Persona }

function reducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'SET_SEGMENTS':
      return { ...state, segments: action.segments, showTranslation: action.segments.map(() => false) }
    case 'SET_INDEX':
      return { ...state, currentIndex: Math.max(0, Math.min(action.index, state.segments.length - 1)) }
    case 'NEXT':
      return { ...state, currentIndex: Math.min(state.currentIndex + 1, state.segments.length - 1) }
    case 'PREV':
      return { ...state, currentIndex: Math.max(state.currentIndex - 1, 0) }
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.playing }
    case 'TOGGLE_MODE':
      return { ...state, mode: state.mode === 'immersion' ? 'sentence' : 'immersion' }
    case 'TOGGLE_TRANSLATION': {
      const showTranslation = [...state.showTranslation]
      showTranslation[action.index] = !showTranslation[action.index]
      return { ...state, showTranslation }
    }
    case 'SET_PERSONA':
      return { ...state, persona: action.persona }
    default:
      return state
  }
}

const initialState: PlayerState = {
  segments: [],
  currentIndex: 0,
  isPlaying: false,
  mode: 'immersion',
  persona: 'general',
  showTranslation: [],
}

const PlayerContext = createContext<{ state: PlayerState; dispatch: React.Dispatch<PlayerAction> } | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <PlayerContext.Provider value={{ state, dispatch }}>{children}</PlayerContext.Provider>
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
```

### Step 2: Git 커밋

```bash
git add projects/nsq-shadowing/src/context/
git commit -m "feat: add PlayerContext with useReducer for state management (no Zustand)"
```

---

## Task 10: localStorage 위치 저장 훅

**목표**: `shadowing:position:{videoId}` 키로 재생 위치 저장/복원, `importedAt` 타임스탬프 검증

### Step 1: 구현

`projects/nsq-shadowing/src/hooks/usePositionPersistence.ts` 생성:

```ts
import { useEffect } from 'react'
import type { PositionState } from '@/types'

function getKey(videoId: string) {
  return `shadowing:position:${videoId}`
}

export function savePosition(videoId: string, state: PositionState) {
  try {
    localStorage.setItem(getKey(videoId), JSON.stringify(state))
  } catch { /* ignore quota errors */ }
}

export function loadPosition(videoId: string, importedAt: string): PositionState | null {
  try {
    const raw = localStorage.getItem(getKey(videoId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PositionState
    // importedAt 불일치 시 오래된 위치 무시
    if (parsed.importedAt !== importedAt) return null
    return parsed
  } catch {
    return null
  }
}

export function usePositionPersistence(
  videoId: string,
  importedAt: string,
  segmentIndex: number,
  onRestore: (index: number) => void
) {
  useEffect(() => {
    const saved = loadPosition(videoId, importedAt)
    if (saved) onRestore(saved.segmentIndex)
  }, [videoId, importedAt]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!videoId || !importedAt) return
    savePosition(videoId, { segmentIndex, offset: 0, importedAt })
  }, [videoId, importedAt, segmentIndex])
}
```

### Step 2: Git 커밋

```bash
git add projects/nsq-shadowing/src/hooks/usePositionPersistence.ts
git commit -m "feat: add localStorage position persistence with importedAt validation"
```

---

## Task 11: 단축키 훅

**목표**: Space / R / N / P / T / M 단축키 글로벌 키다운 핸들러

### Step 1: 구현

`projects/nsq-shadowing/src/hooks/useKeyboardShortcuts.ts` 생성:

```ts
import { useEffect } from 'react'

interface KeyHandlers {
  onSpace: () => void    // 재생/일시정지
  onR: () => void        // 현재 세그먼트 반복
  onN: () => void        // 다음 세그먼트
  onP: () => void        // 이전 세그먼트
  onT: () => void        // 번역 토글 (현재 세그먼트)
  onM: () => void        // 몰입/문장 모드 전환
}

export function useKeyboardShortcuts(handlers: KeyHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // input/textarea 포커스 시 단축키 비활성화
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          handlers.onSpace()
          break
        case 'KeyR':
          handlers.onR()
          break
        case 'KeyN':
          handlers.onN()
          break
        case 'KeyP':
          handlers.onP()
          break
        case 'KeyT':
          handlers.onT()
          break
        case 'KeyM':
          handlers.onM()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
```

### Step 2: Git 커밋

```bash
git add projects/nsq-shadowing/src/hooks/useKeyboardShortcuts.ts
git commit -m "feat: add keyboard shortcut hook (Space/R/N/P/T/M)"
```

---

## Task 12: 홈 페이지 (/)

**목표**: 에피소드 목록 + YouTube URL 입력 + Import 버튼 UI

### Step 1: 구현

`projects/nsq-shadowing/src/app/page.tsx` 생성:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { EpisodeMeta } from '@/types'

function extractVideoId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

export default function HomePage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [episodes, setEpisodes] = useState<EpisodeMeta[]>([])
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/episodes').then(r => r.json()).then(setEpisodes)
  }, [])

  async function handleImport() {
    const videoId = extractVideoId(url)
    if (!videoId) { setError('유효한 YouTube URL을 입력하세요'); return }
    setImporting(true)
    setError('')
    const resp = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
    })
    if (resp.status === 409) { setError('이미 임포트 중입니다'); setImporting(false); return }
    if (!resp.ok) { setError('임포트 요청 실패'); setImporting(false); return }
    router.push(`/import/${videoId}`)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">NSQ Shadowing</h1>

      {/* URL 입력 */}
      <div className="flex gap-3 mb-10">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="YouTube URL 붙여넣기..."
          className="flex-1 bg-zinc-800 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleImport}
          disabled={importing}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium text-sm"
        >
          {importing ? '처리 중...' : 'Import'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

      {/* 에피소드 목록 */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-400 mb-4">에피소드</h2>
        {episodes.length === 0 && (
          <p className="text-zinc-500 text-sm">아직 임포트된 에피소드가 없습니다.</p>
        )}
        <div className="grid gap-3">
          {episodes.map(ep => (
            <button
              key={ep.videoId}
              onClick={() => router.push(`/player/${ep.videoId}`)}
              className="flex items-center gap-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl p-4 text-left transition"
            >
              <img
                src={`/api/thumbnail/${ep.videoId}`}
                alt={ep.title}
                className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
              />
              <div>
                <p className="font-medium text-sm mb-1">{ep.title}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(ep.importedAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
```

### Step 2: Git 커밋

```bash
git add projects/nsq-shadowing/src/app/page.tsx
git commit -m "feat: add home page with episode list and YouTube URL import UI"
```

---

## Task 13: Import 진행 페이지 (/import/[videoId])

**목표**: SSE 수신하며 단계별 진행률 표시, 완료 시 플레이어로 자동 이동

### Step 1: 구현

`projects/nsq-shadowing/src/app/import/[videoId]/page.tsx` 생성:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { ImportProgress, ImportStep } from '@/types'

const STEP_LABELS: Record<ImportStep, string> = {
  download: '오디오 다운로드',
  subtitle: '자막 추출',
  translate: '한국어 번역',
}

export default function ImportPage() {
  const router = useRouter()
  const { videoId } = useParams() as { videoId: string }
  const [steps, setSteps] = useState<Record<ImportStep, number>>({ download: 0, subtitle: 0, translate: 0 })
  const [currentStep, setCurrentStep] = useState<ImportStep>('download')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    async function startImport() {
      const resp = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
        signal: ctrl.signal,
      })
      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        const text = decoder.decode(value)
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data: ImportProgress = JSON.parse(line.replace('data: ', ''))
          setCurrentStep(data.step)
          setSteps(prev => ({ ...prev, [data.step]: data.progress }))
          if (data.error) { setError(data.error); return }
          if (data.done) { setDone(true); setTimeout(() => router.push(`/player/${videoId}`), 1000) }
        }
      }
    }
    startImport().catch(e => { if (e.name !== 'AbortError') setError(String(e)) })
    return () => ctrl.abort()
  }, [videoId, router])

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-8 text-center">임포트 중...</h1>
        <div className="space-y-6">
          {(Object.keys(STEP_LABELS) as ImportStep[]).map(step => (
            <div key={step}>
              <div className="flex justify-between text-sm mb-2">
                <span className={currentStep === step ? 'text-blue-400' : 'text-zinc-400'}>
                  {STEP_LABELS[step]}
                </span>
                <span className="text-zinc-500">{steps[step]}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${steps[step]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {error && (
          <div className="mt-8 p-4 bg-red-900/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-3 text-sm text-zinc-400 hover:text-white underline"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}
        {done && <p className="mt-6 text-center text-green-400">완료! 플레이어로 이동 중...</p>}
      </div>
    </main>
  )
}
```

### Step 2: Git 커밋

```bash
git add projects/nsq-shadowing/src/app/import/
git commit -m "feat: add import progress page with SSE client and step-by-step display"
```

---

## Task 14: 몰입 모드 컴포넌트

**목표**: 전체 세그먼트 세로 나열, 현재 세그먼트 하이라이트 + 자동 스크롤, 번역 blur 토글

### Step 1: 구현

`projects/nsq-shadowing/src/components/ImmersionMode.tsx` 생성:

```tsx
'use client'

import { useRef, useEffect } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import type { Segment } from '@/types'

interface Props {
  audioRef: React.RefObject<HTMLAudioElement>
}

export default function ImmersionMode({ audioRef }: Props) {
  const { state, dispatch } = usePlayer()
  const { segments, currentIndex, showTranslation } = state
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  // 현재 세그먼트 자동 스크롤
  useEffect(() => {
    const el = itemRefs.current[currentIndex]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentIndex])

  function handleSegmentClick(seg: Segment) {
    dispatch({ type: 'SET_INDEX', index: seg.index })
    if (audioRef.current) {
      audioRef.current.currentTime = seg.start
      audioRef.current.play()
      dispatch({ type: 'SET_PLAYING', playing: true })
    }
  }

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 pr-2">
      {segments.map((seg) => (
        <div
          key={seg.index}
          ref={el => { itemRefs.current[seg.index] = el }}
          onClick={() => handleSegmentClick(seg)}
          className={`p-4 rounded-xl cursor-pointer transition-all ${
            seg.index === currentIndex
              ? 'bg-blue-900/40 border border-blue-600/50'
              : 'bg-zinc-900 hover:bg-zinc-800'
          }`}
        >
          <p className="text-sm leading-relaxed mb-2">{seg.text}</p>
          <p
            className={`text-xs text-zinc-400 leading-relaxed cursor-pointer select-none transition-all ${
              showTranslation[seg.index] ? '' : 'blur-sm hover:blur-none'
            }`}
            onClick={e => {
              e.stopPropagation()
              dispatch({ type: 'TOGGLE_TRANSLATION', index: seg.index })
            }}
          >
            {seg.translation || '(번역 없음)'}
          </p>
        </div>
      ))}
    </div>
  )
}
```

### Step 2: Git 커밋

```bash
git add projects/nsq-shadowing/src/components/ImmersionMode.tsx
git commit -m "feat: add ImmersionMode component with auto-scroll and blur translation toggle"
```

---

## Task 15: 문장 모드 컴포넌트

**목표**: 단일 세그먼트 집중 표시, MediaRecorder 녹음/재생, 미지원 환경 비활성화

### Step 1: 구현

`projects/nsq-shadowing/src/components/SentenceMode.tsx` 생성:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { usePlayer } from '@/context/PlayerContext'

interface Props {
  audioRef: React.RefObject<HTMLAudioElement>
  videoId: string
}

export default function SentenceMode({ audioRef, videoId }: Props) {
  const { state, dispatch } = usePlayer()
  const { segments, currentIndex, showTranslation } = state
  const seg = segments[currentIndex]

  const [isRecording, setIsRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [mediaRecorderSupported] = useState(() => typeof MediaRecorder !== 'undefined')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  function playOriginal() {
    if (!audioRef.current || !seg) return
    audioRef.current.currentTime = seg.start
    audioRef.current.play()
    dispatch({ type: 'SET_PLAYING', playing: true })
  }

  async function startRecording() {
    if (!mediaRecorderSupported) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    chunksRef.current = []
    mr.ondataavailable = e => chunksRef.current.push(e.data)
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setRecordedUrl(URL.createObjectURL(blob))
      stream.getTracks().forEach(t => t.stop())
    }
    mr.start()
    mediaRecorderRef.current = mr
    setIsRecording(true)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    }
  }, [recordedUrl])

  if (!seg) return null

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
      <div className="text-center max-w-2xl">
        <p className="text-2xl font-medium leading-relaxed mb-4">{seg.text}</p>
        <p
          className={`text-base text-zinc-400 cursor-pointer transition-all ${
            showTranslation[currentIndex] ? '' : 'blur-sm hover:blur-none'
          }`}
          onClick={() => dispatch({ type: 'TOGGLE_TRANSLATION', index: currentIndex })}
        >
          {seg.translation || '(번역 없음)'}
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch({ type: 'PREV' })}
          className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-sm"
        >
          ← 이전
        </button>
        <button
          onClick={playOriginal}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-medium"
        >
          ▶ 원본 재생
        </button>
        {mediaRecorderSupported ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-6 py-3 rounded-xl font-medium ${
              isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-700 hover:bg-zinc-600'
            }`}
          >
            {isRecording ? '● 녹음 중지' : '🎙 녹음'}
          </button>
        ) : (
          <button disabled className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-500 cursor-not-allowed">
            🎙 녹음 미지원
          </button>
        )}
        {recordedUrl && (
          <audio src={recordedUrl} controls className="h-10" />
        )}
        <button
          onClick={() => dispatch({ type: 'NEXT' })}
          className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-sm"
        >
          다음 →
        </button>
      </div>
    </div>
  )
}
```

### Step 2: Git 커밋

```bash
git add projects/nsq-shadowing/src/components/SentenceMode.tsx
git commit -m "feat: add SentenceMode component with MediaRecorder recording and unsupported env fallback"
```

---

## Task 16: AI 튜터 패널 컴포넌트

**목표**: SSE 스트리밍 채팅, 페르소나 선택, 퀵 액션 칩

### Step 1: 구현

`projects/nsq-shadowing/src/components/TutorPanel.tsx` 생성:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import type { Message, Persona } from '@/types'

const PERSONA_LABELS: Record<Persona, string> = {
  angela: 'Angela Bot',
  mike: 'Mike Bot',
  general: 'General',
}

const QUICK_ACTIONS = [
  { label: '💡 이 표현 설명해줘', prompt: '지금 세그먼트의 표현을 설명해줘.' },
  { label: '✍ 내 문장 교정해줘', prompt: '내가 말할 영어 문장을 교정해줘.' },
  { label: '💬 이 주제로 토론하자', prompt: '이 주제로 영어로 대화해보자.' },
]

interface Props {
  videoId: string
}

export default function TutorPanel({ videoId }: Props) {
  const { state, dispatch } = usePlayer()
  const { segments, currentIndex, persona } = state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const resp = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          persona,
          messages: newMessages,
          currentSegment: segments[currentIndex],
        }),
      })

      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.replace('data: ', ''))
          if (data.delta) {
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + data.delta,
              }
              return updated
            })
          }
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <aside className="w-80 flex flex-col bg-zinc-900 border-l border-zinc-800 h-full">
      {/* 페르소나 선택 */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex gap-2">
          {(Object.keys(PERSONA_LABELS) as Persona[]).map(p => (
            <button
              key={p}
              onClick={() => dispatch({ type: 'SET_PERSONA', persona: p })}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                persona === p ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {PERSONA_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-zinc-500 text-xs text-center mt-4">
            AI 튜터에게 질문하거나 퀵 액션을 선택하세요.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm rounded-xl p-3 ${
              msg.role === 'user'
                ? 'bg-blue-600/30 text-white ml-4'
                : 'bg-zinc-800 text-zinc-200 mr-4'
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 퀵 액션 칩 */}
      <div className="p-3 border-t border-zinc-800 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.label}
            onClick={() => sendMessage(action.prompt)}
            disabled={streaming}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-full px-3 py-1.5"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* 입력창 */}
      <div className="p-4 border-t border-zinc-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="메시지 입력..."
          disabled={streaming}
          className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={streaming || !input.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm"
        >
          전송
        </button>
      </div>
    </aside>
  )
}
```

### Step 2: Git 커밋

```bash
git add projects/nsq-shadowing/src/components/TutorPanel.tsx
git commit -m "feat: add AI TutorPanel with SSE streaming, persona selection, and quick action chips"
```

---

## Task 17: 플레이어 페이지 (/player/[videoId])

**목표**: 전체 플레이어 페이지 조합. AudioRef 관리, 모드 전환, 단축키 연결

### Step 1: 구현

`projects/nsq-shadowing/src/app/player/[videoId]/page.tsx` 생성:

```tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { PlayerProvider, usePlayer } from '@/context/PlayerContext'
import ImmersionMode from '@/components/ImmersionMode'
import SentenceMode from '@/components/SentenceMode'
import TutorPanel from '@/components/TutorPanel'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { usePositionPersistence } from '@/hooks/usePositionPersistence'
import type { EpisodeMeta } from '@/types'

function PlayerContent({ videoId }: { videoId: string }) {
  const { state, dispatch } = usePlayer()
  const { segments, currentIndex, isPlaying, mode } = state
  const audioRef = useRef<HTMLAudioElement>(null)
  const [meta, setMeta] = useRefState<EpisodeMeta | null>(null)

  useEffect(() => {
    fetch(`/api/episodes/${videoId}`)
      .then(r => r.json())
      .then(({ meta, segments }) => {
        setMeta(meta)
        dispatch({ type: 'SET_SEGMENTS', segments })
      })
  }, [videoId])

  // 오디오 timeupdate → 현재 세그먼트 인덱스 자동 업데이트
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    function handleTimeUpdate() {
      const t = audio!.currentTime
      const idx = segments.findIndex(s => t >= s.start && t < s.end)
      if (idx !== -1 && idx !== currentIndex) dispatch({ type: 'SET_INDEX', index: idx })
    }
    audio.addEventListener('timeupdate', handleTimeUpdate)
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate)
  }, [segments, currentIndex])

  // isPlaying 상태 동기화
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.play().catch(() => {})
    else audio.pause()
  }, [isPlaying])

  // localStorage 위치 저장/복원
  usePositionPersistence(
    videoId,
    meta?.importedAt ?? '',
    currentIndex,
    (idx) => dispatch({ type: 'SET_INDEX', index: idx })
  )

  const handlers = useCallback(() => ({
    onSpace: () => dispatch({ type: 'TOGGLE_PLAY' }),
    onR: () => {
      const seg = segments[currentIndex]
      if (audioRef.current && seg) {
        audioRef.current.currentTime = seg.start
        audioRef.current.play()
        dispatch({ type: 'SET_PLAYING', playing: true })
      }
    },
    onN: () => dispatch({ type: 'NEXT' }),
    onP: () => dispatch({ type: 'PREV' }),
    onT: () => dispatch({ type: 'TOGGLE_TRANSLATION', index: currentIndex }),
    onM: () => dispatch({ type: 'TOGGLE_MODE' }),
  }), [segments, currentIndex, dispatch])

  useKeyboardShortcuts(handlers())

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
          <h1 className="text-sm font-medium text-zinc-400 truncate max-w-md">{meta?.title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              {currentIndex + 1} / {segments.length}
            </span>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_MODE' })}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg"
            >
              {mode === 'immersion' ? '문장 모드' : '몰입 모드'}
            </button>
          </div>
        </header>

        {/* 모드별 컨텐츠 */}
        <div className="flex-1 overflow-hidden p-6">
          {mode === 'immersion'
            ? <ImmersionMode audioRef={audioRef} />
            : <SentenceMode audioRef={audioRef} videoId={videoId} />
          }
        </div>

        {/* 오디오 엘리먼트 (숨김) */}
        <audio
          ref={audioRef}
          src={`/api/audio/${videoId}`}
          onPlay={() => dispatch({ type: 'SET_PLAYING', playing: true })}
          onPause={() => dispatch({ type: 'SET_PLAYING', playing: false })}
          onEnded={() => dispatch({ type: 'SET_PLAYING', playing: false })}
        />
      </div>

      {/* AI 튜터 패널 */}
      <TutorPanel videoId={videoId} />
    </div>
  )
}

// useRef + useState 결합 헬퍼 (re-render 유발하는 setState 래퍼)
function useRefState<T>(initial: T): [T, (v: T) => void] {
  const [state, setState] = require('react').useState<T>(initial)
  return [state, setState]
}

export default function PlayerPage() {
  const { videoId } = useParams() as { videoId: string }
  return (
    <PlayerProvider>
      <PlayerContent videoId={videoId} />
    </PlayerProvider>
  )
}
```

### Step 2: Git 커밋

```bash
git add projects/nsq-shadowing/src/app/player/
git commit -m "feat: add player page integrating immersion/sentence modes, audio, and keyboard shortcuts"
```

---

## Task 18: 전체 통합 테스트 & 수동 E2E 검증

**목표**: 앱 실행 후 핵심 플로우 수동 검증

### Step 1: 전체 테스트 실행

```bash
cd projects/nsq-shadowing && npx vitest run
# Expected: All tests pass (setup, validate, vtt, translate, audio-range)
```

### Step 2: 개발 서버 실행 및 E2E 확인

```bash
cd projects/nsq-shadowing && npm run dev
```

체크리스트:

- [ ] `http://localhost:3000` 홈 화면 정상 렌더링
- [ ] YouTube URL 입력 → `extractVideoId()` 정상 파싱
- [ ] `/import/{videoId}` SSE 진행률 3단계 표시
- [ ] `/player/{videoId}` 몰입 모드 세그먼트 목록 표시
- [ ] 세그먼트 클릭 → 오디오 해당 구간 재생
- [ ] 번역 blur → 클릭 시 공개
- [ ] `M` 키 → 문장/몰입 모드 전환
- [ ] `Space` 키 → 재생/일시정지
- [ ] 문장 모드 → 녹음 버튼 작동
- [ ] AI 튜터 패널 → 페르소나 전환 + 메시지 전송

### Step 3: 최종 Git 커밋

```bash
git add .
git commit -m "feat: complete nsq-shadowing app - all tasks implemented and verified"
```

---

## 환경변수 설정 참고

`.env.local`:

```
OPENROUTER_API_KEY=<your-key>
TRANSLATION_MODEL=google/gemini-flash-1.5
TUTOR_MODEL=anthropic/claude-haiku-4-5
```

yt-dlp 설치 확인:

```bash
which yt-dlp || brew install yt-dlp
```
