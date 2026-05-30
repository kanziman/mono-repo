'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { ImportProgress, ImportStep } from '@/types'

const STEP_LABELS: Record<ImportStep, string> = {
  download: '다운로드',
  subtitle: '자막 추출',
  translate: '번역',
}

const STEPS: ImportStep[] = ['download', 'subtitle', 'translate']

export default function ImportPage() {
  const router = useRouter()
  const params = useParams()
  const videoId = params.videoId as string

  const [steps, setSteps] = useState<Record<ImportStep, number>>({
    download: 0,
    subtitle: 0,
    translate: 0,
  })
  const [activeStep, setActiveStep] = useState<ImportStep>('download')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function startImport() {
      try {
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId }),
          signal: controller.signal,
        })

        if (!res.ok && res.status !== 200) {
          if (res.status === 409) {
            setError('이미 임포트 중입니다')
          } else {
            setError('임포트 요청에 실패했습니다')
          }
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
            try {
              data = JSON.parse(jsonStr)
            } catch {
              continue
            }

            if (data.error) {
              setError(data.error)
              return
            }

            setSteps((prev) => ({ ...prev, [data.step]: data.progress }))
            setActiveStep(data.step)

            if (data.done === true) {
              setDone(true)
              setTimeout(() => {
                router.push('/player/' + videoId)
              }, 1000)
              return
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      }
    }

    startImport()

    return () => {
      controller.abort()
    }
  }, [videoId, router])

  return (
    <main className="min-h-screen bg-background-normal-normal flex items-center justify-center px-6">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-label-normal">에피소드 임포트 중</h1>
          <p className="text-label-alternative text-sm">{videoId}</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-status-negative bg-status-negative/10 p-4 flex flex-col gap-3">
            <p className="text-status-negative font-medium">오류가 발생했습니다</p>
            <p className="text-status-negative/80 text-sm">{error}</p>
            <a href="/" className="text-primary-normal underline text-sm">
              홈으로 돌아가기
            </a>
          </div>
        ) : done ? (
          <div className="text-label-normal text-center py-8">
            완료! 플레이어로 이동 중...
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {STEPS.map((step) => {
              const isActive = step === activeStep
              const progress = steps[step]
              return (
                <div key={step} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span
                      className={
                        isActive ? 'text-primary-normal font-semibold' : 'text-label-alternative'
                      }
                    >
                      {STEP_LABELS[step]}
                    </span>
                    <span
                      className={
                        isActive ? 'text-primary-normal text-sm' : 'text-label-alternative text-sm'
                      }
                    >
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-background-elevated-normal overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isActive ? 'bg-primary-normal' : 'bg-background-elevated-normal'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
