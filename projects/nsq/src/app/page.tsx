'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Skeleton, Icon } from '@ds'
import { useTheme } from 'next-themes'
import type { EpisodeEntry, ImportStep } from '@/types'
import type { ImportProgress } from '@/types'
import { extractVideoId } from '@/lib/youtube'

const IMPORT_STEPS: { key: ImportStep; label: string }[] = [
  { key: 'download', label: '다운로드' },
  { key: 'subtitle', label: '자막 추출' },
  { key: 'translate', label: '번역' },
]

function EpisodeThumb({ videoId }: { videoId: string }) {
  const [error, setError] = useState(false)
  if (error) {
    return (
      <div className="w-full h-full bg-fill-normal flex items-center justify-center">
        <span className="text-label2 font-bold text-label-assistive">NSQ</span>
      </div>
    )
  }
  return (
    <img
      src={'/api/thumbnail/' + videoId}
      className="w-full h-full object-cover"
      alt=""
      onError={() => setError(true)}
    />
  )
}

export default function Home() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | undefined>(undefined)
  const [episodes, setEpisodes] = useState<EpisodeEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [importingVideoId, setImportingVideoId] = useState<string | null>(null)
  const [importSteps, setImportSteps] = useState<Record<ImportStep, number>>({ download: 0, subtitle: 0, translate: 0 })
  const [importActiveStep, setImportActiveStep] = useState<ImportStep>('download')
  const [importError, setImportError] = useState<string | null>(null)

  const STEP_META: { key: ImportStep; label: string }[] = [
    { key: 'download', label: '다운로드' },
    { key: 'subtitle', label: '자막' },
    { key: 'translate', label: '번역' },
  ]

  function handleResumeStep(videoId: string, fromStep: ImportStep) {
    setImportingVideoId(videoId)
    setImportSteps({ download: 0, subtitle: 0, translate: 0 })
    setImportActiveStep('download')
    setImportError(null)
    startImportSSE(videoId, fromStep)
  }

  useEffect(() => {
    setMounted(true)
    fetch('/api/episodes')
      .then((res) => res.json())
      .then((data: EpisodeEntry[]) => {
        setEpisodes(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function startImportSSE(videoId: string, fromStep?: ImportStep) {
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, fromStep }),
      })
      if (!res.ok) {
        setImportError(res.status === 409 ? '이미 임포트 중입니다' : '임포트 요청에 실패했습니다')
        return
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const jsonStr = trimmed.slice('data:'.length).trim()
          if (!jsonStr) continue
          let data: ImportProgress
          try { data = JSON.parse(jsonStr) } catch { continue }
          if (data.error) { setImportError(data.error); return }
          setImportSteps((prev) => ({ ...prev, [data.step]: data.progress }))
          setImportActiveStep(data.step)
          if (data.done) {
            setTimeout(async () => {
              const updated: EpisodeEntry[] = await fetch('/api/episodes').then((r) => r.json())
              setEpisodes(updated)
              setImportingVideoId(null)
            }, 1500)
            return
          }
        }
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    }
  }

  function handleImport() {
    setUrlError(undefined)
    const videoId = extractVideoId(url)
    if (!videoId) {
      setUrlError('올바른 YouTube URL을 입력하세요')
      return
    }
    setUrl('')
    setImportingVideoId(videoId)
    setImportSteps({ download: 0, subtitle: 0, translate: 0 })
    setImportActiveStep('download')
    setImportError(null)
    startImportSSE(videoId)
  }

  return (
    <main className="min-h-screen bg-background-normal-normal px-6 py-12 text-label-normal">
      <div className="mx-auto max-w-2xl flex flex-col gap-10">

        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-title2 text-label-normal font-bold">NSQ Shadowing</h1>
            <p className="text-body2 text-label-alternative">YouTube 에피소드를 임포트해 영어 쉐도잉을 연습하세요.</p>
          </div>
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-background-elevated-normal border border-line-normal-normal hover:border-primary-normal/40 text-label-normal hover:text-primary-normal transition-colors"
              aria-label="테마 전환"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
            </button>
          )}
        </div>

        {/* Glassmorphic import box */}
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2 items-center bg-background-elevated-normal border border-line-normal-normal rounded-xl px-2 py-1.5 focus-within:border-primary-normal transition-colors">
            <input
              className="flex-1 bg-transparent border-none outline-none text-body2 text-label-normal placeholder:text-label-assistive px-3 py-2"
              placeholder="YouTube URL 입력..."
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(undefined) }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleImport() }}
            />
            <Button
              variant="solid"
              color="primary"
              size="small"
              className="min-w-[72px]"
              onClick={handleImport}
            >
              임포트
            </Button>
          </div>
          {urlError && <p className="text-caption1 text-status-negative px-1">{urlError}</p>}
        </div>

        {/* Episode list */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-heading2 text-label-normal">에피소드 목록</h2>
            {!loading && (
              <span className="text-caption1 text-label-assistive bg-fill-normal px-2 py-0.5 rounded-full">
                {episodes.length}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {/* Inline import progress card */}
            {importingVideoId && (
              <div className="border border-dashed border-primary-normal/40 bg-background-elevated-normal/60 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <img
                    src={`https://img.youtube.com/vi/${importingVideoId}/mqdefault.jpg`}
                    className="w-20 h-12 flex-shrink-0 rounded-lg object-cover bg-fill-normal"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-3 h-3 border-2 border-primary-normal/30 border-t-primary-normal rounded-full animate-spin flex-shrink-0" />
                      <span className="text-body2 font-bold text-label-normal">에피소드 임포트 중</span>
                    </div>
                    <p className="text-caption1 text-label-assistive font-mono truncate">{importingVideoId}</p>
                  </div>
                </div>

                {importError ? (
                  <p className="text-caption1 text-status-negative">{importError}</p>
                ) : (
                  <div className="flex flex-col gap-2 border-t border-line-normal-normal/20 pt-3">
                    {IMPORT_STEPS.map(({ key, label }) => {
                      const progress = importSteps[key]
                      const isActive = importActiveStep === key && progress < 100
                      const isDone = progress === 100
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className={`text-body2 ${isDone ? 'text-status-positive font-medium' : isActive ? 'text-primary-normal font-semibold' : 'text-label-assistive'}`}>
                            {label}
                          </span>
                          <div className="flex items-center gap-2">
                            {(isActive || isDone) && (
                              <div className="w-24 h-1 rounded-full bg-fill-normal overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-100 ${isDone ? 'bg-status-positive' : 'bg-primary-normal'}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                            <span className={`font-mono text-caption1 w-9 text-right ${isDone ? 'text-status-positive' : isActive ? 'text-primary-normal' : 'text-label-assistive'}`}>
                              {isDone || isActive ? `${progress}%` : '—'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4 bg-background-elevated-normal border border-line-normal-normal/10 rounded-xl px-4 py-3">
                    <Skeleton className="w-20 h-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-2">
                      <Skeleton className="w-3/4 h-4 rounded" />
                      <Skeleton className="w-1/3 h-3 rounded" />
                    </div>
                  </div>
                ))}
              </>
            ) : episodes.length === 0 && !importingVideoId ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-fill-normal flex items-center justify-center text-2xl">
                  🎧
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-headline2 text-label-normal">아직 에피소드가 없어요</p>
                  <p className="text-body2 text-label-alternative">위 입력창에 YouTube URL을 붙여넣어 시작하세요</p>
                </div>
              </div>
            ) : (
              episodes.map((meta) => (
                <div
                  key={meta.videoId}
                  className="flex items-center gap-4 bg-background-elevated-normal border border-line-normal-normal/10 rounded-xl px-4 py-3 cursor-pointer hover:border-primary-normal/40 transition-colors"
                  onClick={() => router.push('/player/' + meta.videoId)}
                >
                  <div className="w-20 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-fill-normal">
                    <EpisodeThumb videoId={meta.videoId} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body2 font-semibold text-label-normal truncate">{meta.title}</p>
                    <p className="text-caption1 text-label-assistive mt-0.5">
                      {new Date(meta.importedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <Button
                    variant="solid"
                    color="assistive"
                    size="small"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); router.push('/player/' + meta.videoId) }}
                  >
                    ▶ 재생
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  )
}
