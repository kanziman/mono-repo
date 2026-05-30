'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PlayerProvider, usePlayer } from '@/context/PlayerContext'
import { usePositionPersistence } from '@/hooks/usePositionPersistence'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import ImmersionMode from '@/components/ImmersionMode'
import SentenceMode from '@/components/SentenceMode'
import TutorPanel from '@/components/TutorPanel'
import { Button } from '@ds'
import type { EpisodeMeta } from '@/types'

export default function PlayerPage() {
  return (
    <PlayerProvider>
      <PlayerContent />
    </PlayerProvider>
  )
}

function PlayerContent() {
  const params = useParams()
  const videoId = typeof params.videoId === 'string' ? params.videoId : ''
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement>(null)
  const { state, dispatch } = usePlayer()
  const [meta, setMeta] = useState<EpisodeMeta | null>(null)

  // Mount: fetch episode data
  useEffect(() => {
    fetch('/api/episodes/' + videoId)
      .then(res => res.ok ? res.json() : Promise.reject('Not found'))
      .then(({ meta: m, segments }) => {
        setMeta(m)
        dispatch({ type: 'SET_SEGMENTS', payload: segments })
      })
      .catch(() => router.push('/'))
  }, [videoId])

  // Audio timeupdate: track current segment
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      const t = audio.currentTime
      const idx = state.segments.findIndex((s, i) => {
        const next = state.segments[i + 1]
        return t >= s.start && (next ? t < next.start : true)
      })
      if (idx !== -1 && idx !== state.currentIndex) {
        dispatch({ type: 'SET_INDEX', payload: idx })
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate)
  }, [state.segments, state.currentIndex])

  // Sync isPlaying → audio play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (state.isPlaying) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [state.isPlaying])

  // Audio events → dispatch
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => dispatch({ type: 'SET_PLAYING', payload: true })
    const onPause = () => dispatch({ type: 'SET_PLAYING', payload: false })
    const onEnded = () => dispatch({ type: 'SET_PLAYING', payload: false })
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  usePositionPersistence(
    videoId,
    meta?.importedAt ?? '',
    state.currentIndex,
    (savedIndex) => dispatch({ type: 'SET_INDEX', payload: savedIndex })
  )

  useKeyboardShortcuts({
    onSpace: () => dispatch({ type: 'TOGGLE_PLAY' }),
    onR: () => {
      const seg = state.segments[state.currentIndex]
      if (seg && audioRef.current) {
        audioRef.current.currentTime = seg.start
        audioRef.current.play().catch(() => {})
        dispatch({ type: 'SET_PLAYING', payload: true })
      }
    },
    onN: () => dispatch({ type: 'NEXT' }),
    onP: () => dispatch({ type: 'PREV' }),
    onT: () => dispatch({ type: 'TOGGLE_TRANSLATION', payload: state.currentIndex }),
    onM: () => dispatch({ type: 'TOGGLE_MODE' }),
  })

  return (
    <div className="flex flex-col h-screen bg-background-normal-normal">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-background-normal-normal border-b border-line-normal-normal">
        <div>
          <span className="text-label-normal">{meta?.title ?? '로딩 중...'}</span>
          <span className="text-label-alternative ml-2 text-sm">
            {state.currentIndex + 1} / {state.segments.length}
          </span>
        </div>
        <Button variant="outlined" color="assistive" size="small" onClick={() => dispatch({ type: 'TOGGLE_MODE' })}>
          {state.mode === 'immersion' ? '문장 모드' : '몰입 모드'}
        </Button>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mode component */}
        <div className="flex-1 overflow-auto">
          {state.mode === 'immersion'
            ? <ImmersionMode audioRef={audioRef} />
            : <SentenceMode audioRef={audioRef} videoId={videoId} />
          }
        </div>

        {/* Tutor panel - fixed right side */}
        <div className="w-80 border-l border-line-normal-normal overflow-auto">
          <TutorPanel videoId={videoId} />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={'/api/audio/' + videoId} className="hidden" />
    </div>
  )
}
