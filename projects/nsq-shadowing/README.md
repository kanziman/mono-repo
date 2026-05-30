# NSQ Shadowing

Local English shadowing app for YouTube "No Stupid Questions" podcast episodes.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm test
npm run lint
npm run build
```

## Environment

`.env.example` documents the local variables used by import, translation, and tutor features:

```bash
OPENROUTER_API_KEY=your-openrouter-api-key-here
TRANSLATION_MODEL=google/gemini-flash-1.5
TUTOR_MODEL=anthropic/claude-haiku-4-5
```

## Design

This app consumes the shared mono-repo design system from `../../design-system/`.
Use semantic tokens, Pretendard, and class-based light/dark mode via `next-themes`.
