'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, TextField, Card, Skeleton } from '@ds'
import type { EpisodeMeta } from '@/types'

function extractVideoId(url: string): string | null {
  const pattern = /(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = url.match(pattern)
  return match ? match[1] : null
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
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-label-normal">NSQ Shadowing</h1>
          <p className="text-label-alternative">YouTube 에피소드를 임포트해 영어 쉐도잉을 연습하세요.</p>
        </div>

        <div className="flex gap-3 items-start">
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

        <div>
          <h2 className="text-lg font-semibold text-label-normal mb-4">에피소드 목록</h2>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="w-full h-48 rounded-2xl" />
              ))}
            </div>
          ) : episodes.length === 0 ? (
            <p className="text-label-alternative">아직 에피소드가 없습니다</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {episodes.map((meta) => (
                <Card
                  key={meta.videoId}
                  hoverable
                  className="p-0 overflow-hidden"
                  onClick={() => router.push('/player/' + meta.videoId)}
                >
                  <img
                    src={'/api/thumbnail/' + meta.videoId}
                    className="w-full aspect-video object-cover"
                    alt={meta.title}
                  />
                  <div className="p-4 flex flex-col gap-1">
                    <p className="text-label-normal font-medium line-clamp-2">{meta.title}</p>
                    <p className="text-label-alternative text-sm">
                      {new Date(meta.importedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
