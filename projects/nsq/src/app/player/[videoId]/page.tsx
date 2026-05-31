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
      audio.play().catch(() => { })
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
        audioRef.current.play().catch(() => { })
        dispatch({ type: 'SET_PLAYING', payload: true })
      }
    },
    onN: () => dispatch({ type: 'NEXT' }),
    onP: () => dispatch({ type: 'PREV' }),
    onT: () => dispatch({ type: 'TOGGLE_TRANSLATION', payload: state.currentIndex }),
    onM: () => dispatch({ type: 'TOGGLE_MODE' }),
  })

  const handleRepeat = () => {
    const seg = state.segments[state.currentIndex]
    if (seg && audioRef.current) {
      audioRef.current.currentTime = seg.start
      audioRef.current.play().catch(() => { })
      dispatch({ type: 'SET_PLAYING', payload: true })
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-screen bg-background-normal-normal">
      {/* Redesigned Solid Dark Header compliant with Design System */}
      <header className="bg-background-elevated-normal border-b border-line-normal-normal flex-shrink-0 flex items-center justify-between px-6 py-4 z-10 shadow-normal-small">
        {/* Left Side: Back Navigation & Episode Title */}
        <div className="flex flex-col gap-1 max-w-[40%]">
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center gap-1.5 text-caption1 text-label-assistive hover:text-primary-normal transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            대시보드로 돌아가기
          </button>
          <span className="text-headline1 text-label-normal font-bold truncate">
            {meta?.title ?? '로딩 중...'}
          </span>
        </div>

        {/* Center: Inline Audio Controls & Progress Bar */}
        <div className="flex items-center gap-3 bg-background-normal-normal border border-line-solid-normal px-4 py-1.5 rounded-full shadow-normal-small">
          <Button
            variant="outlined"
            color="assistive"
            size="small"
            iconOnly
            className="rounded-full !w-8 !h-8 border-transparent"
            onClick={() => dispatch({ type: 'PREV' })}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="19 20 9 12 19 4 19 20"></polygon>
              <line x1="5" y1="19" x2="5" y2="5"></line>
            </svg>
          </Button>
          
          <Button
            variant="solid"
            color="primary"
            size="small"
            iconOnly
            className="rounded-full !w-9 !h-9 shadow-normal-medium"
            onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
          >
            {state.isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </Button>
          
          <Button
            variant="outlined"
            color="assistive"
            size="small"
            iconOnly
            className="rounded-full !w-8 !h-8 border-transparent"
            onClick={() => dispatch({ type: 'NEXT' })}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
          </Button>

          <Button
            variant="outlined"
            color="assistive"
            size="small"
            iconOnly
            className="rounded-full !w-8 !h-8 border-transparent"
            onClick={handleRepeat}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
          </Button>

          <div className="flex flex-col gap-1 w-[200px]">
            <div className="h-1 bg-fill-normal rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-normal rounded-full transition-all duration-100"
                style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-label-assistive font-mono">
              <span>{formatTime(currentTime)}</span>
              {state.segments.length > 0 && (
                <span className="text-primary-normal font-semibold">
                  {state.currentIndex + 1} / {state.segments.length}
                </span>
              )}
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Mode Switcher */}
        <div className="header-right">
          <div className="flex gap-1 bg-background-normal-alternative border border-line-solid-normal p-1 rounded-lg">
            <Button
              variant={state.mode === 'immersion' ? 'solid' : 'outlined'}
              color={state.mode === 'immersion' ? 'primary' : 'assistive'}
              size="small"
              className={state.mode === 'immersion' ? '' : 'border-transparent text-label-alternative'}
              onClick={() => { if (state.mode !== 'immersion') dispatch({ type: 'TOGGLE_MODE' }) }}
            >
              몰입 모드
            </Button>
            <Button
              variant={state.mode === 'sentence' ? 'solid' : 'outlined'}
              color={state.mode === 'sentence' ? 'primary' : 'assistive'}
              size="small"
              className={state.mode === 'sentence' ? '' : 'border-transparent text-label-alternative'}
              onClick={() => { if (state.mode !== 'sentence') dispatch({ type: 'TOGGLE_MODE' }) }}
            >
              문장 모드
            </Button>
          </div>
        </div>
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
        <div className="w-[420px] flex flex-col border-l border-line-normal-normal overflow-hidden flex-shrink-0">
          <TutorPanel videoId={videoId} />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={'/api/audio/' + videoId} className="hidden" />
    </div>
  )
}
