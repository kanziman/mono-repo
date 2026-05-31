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
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

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

  // Audio events → dispatch + time/duration tracking
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => dispatch({ type: 'SET_PLAYING', payload: true })
    const onPause = () => dispatch({ type: 'SET_PLAYING', payload: false })
    const onEnded = () => dispatch({ type: 'SET_PLAYING', payload: false })
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration || 0)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
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

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-screen bg-background-normal-normal">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-[10px] bg-[#1e293b] border-b border-[#334155]">
        <span className="flex-1 min-w-0 text-sm font-bold text-[#f8fafc] truncate">
          {meta?.title ?? '로딩 중...'}
        </span>
        <span className={[
          'text-[11px] font-extrabold px-[10px] py-[3px] rounded flex-shrink-0',
          state.mode === 'immersion'
            ? 'bg-[#1d4ed8] text-[#bfdbfe]'
            : 'bg-[#7c3aed] text-[#ddd6fe]',
        ].join(' ')}>
          {state.mode === 'immersion' ? '몰입' : '문장'}
        </span>
        <Button variant="outlined" color="assistive" size="small" onClick={() => dispatch({ type: 'TOGGLE_MODE' })}>
          모드 전환
        </Button>
      </header>

      {/* Player controls bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] border-b border-[#334155] flex-shrink-0">
        <button
          className="px-3 py-1.5 rounded text-xs font-bold bg-[#334155] text-[#e2e8f0] hover:bg-[#475569] transition-colors whitespace-nowrap"
          onClick={() => dispatch({ type: 'PREV' })}
        >◀ 이전</button>
        <button
          className="px-3 py-1.5 rounded text-xs font-bold bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors whitespace-nowrap"
          onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
        >{state.isPlaying ? '⏸ 정지' : '▶ 재생'}</button>
        <button
          className="px-3 py-1.5 rounded text-xs font-bold bg-[#334155] text-[#e2e8f0] hover:bg-[#475569] transition-colors whitespace-nowrap"
          onClick={() => dispatch({ type: 'NEXT' })}
        >다음 ▶</button>
        <button
          className="px-3 py-1.5 rounded text-xs font-bold bg-[#334155] text-[#e2e8f0] hover:bg-[#475569] transition-colors whitespace-nowrap"
          onClick={() => {
            const seg = state.segments[state.currentIndex]
            if (seg && audioRef.current) {
              audioRef.current.currentTime = seg.start
              audioRef.current.play().catch(() => {})
              dispatch({ type: 'SET_PLAYING', payload: true })
            }
          }}
        >반복 R</button>
        <div className="flex-1 h-1 bg-[#334155] rounded mx-1 overflow-hidden">
          <div
            className="h-full bg-[#3b82f6] rounded"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-[11px] text-[#94a3b8] whitespace-nowrap font-mono flex-shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

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
        <div className="w-[420px] flex flex-col border-l border-line-normal-normal overflow-hidden flex-shrink-0">
          <TutorPanel videoId={videoId} />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={'/api/audio/' + videoId} className="hidden" />
    </div>
  )
}
