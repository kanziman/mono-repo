'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, TextField, Skeleton } from '@ds'
import type { EpisodeMeta } from '@/types'
import { extractVideoId } from '@/lib/youtube'

function EpisodeThumb({ videoId }: { videoId: string }) {
  const [error, setError] = useState(false)
  if (error) {
    return (
      <div className="w-[72px] h-[48px] rounded-md bg-fill-normal flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-label-alternative">NSQ</span>
      </div>
    )
  }
  return (
    <img
      src={'/api/thumbnail/' + videoId}
      className="w-[72px] h-[48px] rounded-md object-cover flex-shrink-0"
      alt=""
      onError={() => setError(true)}
    />
  )
}

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | undefined>(undefined)
  const [episodes, setEpisodes] = useState<EpisodeMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/episodes')
      .then((res) => res.json())
      .then((data: EpisodeMeta[]) => {
        setEpisodes(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleImport() {
    setUrlError(undefined)
    const videoId = extractVideoId(url)
    if (!videoId) {
      setUrlError('올바른 YouTube URL을 입력하세요')
      return
    }
    router.push('/import/' + videoId)
  }

  return (
    <main className="min-h-screen bg-background-normal-normal px-6 py-12 text-label-normal">
      <div className="mx-auto max-w-4xl flex flex-col gap-10">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-label-normal">NSQ Shadowing</h1>
          <p className="text-label-alternative text-sm">YouTube 에피소드를 임포트해 영어 쉐도잉을 연습하세요.</p>
        </div>

        {/* Import bar */}
        <div className="flex gap-2 p-3 bg-background-elevated-normal border border-line-solid-normal rounded-xl mb-6 items-start">
          <div className="flex-1">
            <TextField
              label=""
              placeholder="YouTube URL 입력..."
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setUrl(e.target.value)
                setUrlError(undefined)
              }}
              errorText={urlError}
            />
          </div>
          <div className="pt-1">
            <Button
              variant="solid"
              color="primary"
              onClick={handleImport}
            >
              임포트
            </Button>
          </div>
        </div>

        {/* Episode list */}
        <div>
          <h2 className="text-lg font-semibold text-label-normal mb-4">에피소드 목록</h2>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="w-full h-16 rounded-xl" />
              ))}
            </div>
          ) : episodes.length === 0 ? (
            <p className="text-label-alternative">아직 에피소드가 없습니다</p>
          ) : (
            <div className="flex flex-col gap-3">
              {episodes.map((meta) => (
                <div
                  key={meta.videoId}
                  className="flex items-center gap-4 p-3 bg-background-elevated-normal border border-line-solid-normal rounded-xl"
                >
                  <EpisodeThumb videoId={meta.videoId} />
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p className="text-label-normal font-semibold text-sm line-clamp-2">{meta.title}</p>
                    <p className="text-label-alternative text-xs">
                      {new Date(meta.importedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      variant="outlined"
                      color="assistive"
                      size="small"
                      onClick={() => router.push('/player/' + meta.videoId)}
                    >
                      ▶ 재생
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
