"use client";

// Development-only page: validates that design system semantic tokens resolve correctly.
// Visit /dev/tokens in the browser to confirm dark/light mode token colors at a glance.
// NOT included in production builds (guarded by NODE_ENV check at runtime).
import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@ds'

const COLOR_TOKENS = [
  { label: 'background-normal-normal',      bg: 'bg-background-normal-normal',      text: 'text-label-normal' },
  { label: 'background-normal-alternative', bg: 'bg-background-normal-alternative', text: 'text-label-normal' },
  { label: 'background-elevated-normal',    bg: 'bg-background-elevated-normal',    text: 'text-label-normal' },
  { label: 'primary-normal',                bg: 'bg-primary-normal',                text: 'text-static-white' },
  { label: 'label-normal (text)',           bg: 'bg-background-elevated-normal',    text: 'text-label-normal' },
  { label: 'label-alternative (text)',      bg: 'bg-background-elevated-normal',    text: 'text-label-alternative' },
  { label: 'label-assistive (text)',        bg: 'bg-background-elevated-normal',    text: 'text-label-assistive' },
  { label: 'status-positive',              bg: 'bg-status-positive',               text: 'text-static-white' },
  { label: 'status-cautionary',            bg: 'bg-status-cautionary',             text: 'text-static-white' },
  { label: 'status-negative',              bg: 'bg-status-negative',               text: 'text-static-white' },
  { label: 'line-normal-normal (border)',  bg: 'bg-background-elevated-normal border border-line-normal-normal', text: 'text-label-normal' },
  { label: 'fill-normal',                  bg: 'bg-fill-normal',                   text: 'text-label-normal' },
]

export default function TokensPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="min-h-screen bg-background-normal-normal p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-label-normal text-2xl font-bold mb-2">Design Token Swatches</h1>
          <p className="text-label-alternative text-sm">
            Toggle dark/light mode to verify each token resolves correctly.
            If a swatch looks wrong (e.g. white card on white background), the token is broken.
          </p>
        </div>
        <div>
          {mounted && (
            <Button
              variant="outlined"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              Toggle Mode (Current: {theme})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {COLOR_TOKENS.map(({ label, bg, text }) => (
          <div key={label} className={`rounded-xl p-4 ${bg}`}>
            <p className={`text-sm font-mono ${text}`}>{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-label-normal text-lg font-semibold mb-4">ThemeProvider Check</h2>
        <p className="text-label-alternative text-sm">
          If dark mode is active, the <code className="text-primary-normal">{'<html>'}</code> element
          should have <code className="text-primary-normal">{'class="dark"'}</code>.
          Open DevTools → Elements and verify.
        </p>
      </div>
    </main>
  )
}

