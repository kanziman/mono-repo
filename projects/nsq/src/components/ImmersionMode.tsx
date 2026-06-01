'use client'

import React, { useRef, useEffect } from 'react'
import { usePlayer } from '@/context/PlayerContext'

function formatTs(s: number | undefined) {
  if (s == null || isNaN(s)) return '--:--'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const SPEAKER_STYLE: Record<string, string> = {
  Angela: 'bg-primary-normal/10 text-primary-normal border-primary-normal/20',
  Steven: 'bg-status-warning/10 text-status-warning border-status-warning/20',
}

function SpeakerBadge({ speaker }: { speaker?: string }) {
  if (!speaker || speaker === 'Unknown') return null
  const cls = SPEAKER_STYLE[speaker] ?? 'bg-fill-normal text-label-assistive border-line-normal-normal/20'
  return (
    <span className={`inline-block text-[10px] font-extrabold px-[7px] py-[1px] rounded mr-1.5 align-middle border ${cls}`}>
      {speaker}
    </span>
  )
}

interface ImmersionModeProps {
  audioRef: React.RefObject<HTMLAudioElement>
}

export default function ImmersionMode({ audioRef }: ImmersionModeProps) {
  const { state, dispatch } = usePlayer()
  const { segments, currentIndex, showTranslation } = state
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    itemRefs.current[currentIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentIndex])

  return (
    <div className="flex flex-col gap-3 p-4">
      {segments.map((seg) => {
        const isActive = seg.index === currentIndex

        const handleSegmentClick = () => {
          dispatch({ type: 'SET_INDEX', payload: seg.index })
          audioRef.current!.currentTime = seg.start
          audioRef.current!.play().catch(() => {})
          dispatch({ type: 'SET_PLAYING', payload: true })
        }

        const handleTranslationClick = (e: React.MouseEvent) => {
          e.stopPropagation()
          dispatch({ type: 'TOGGLE_TRANSLATION', payload: seg.index })
        }

        return (
          <div
            key={seg.index}
            ref={(el) => { itemRefs.current[seg.index] = el }}
            onClick={handleSegmentClick}
            className={[
              'cursor-pointer transition-all border rounded-xl p-5 relative overflow-hidden',
              isActive
                ? 'bg-primary-normal/5 border-primary-normal shadow-normal-medium'
                : 'bg-background-elevated-normal border-line-normal-normal hover:border-primary-normal/30 shadow-normal-xsmall hover:shadow-normal-small',
            ].join(' ')}
          >
            {/* Active left highlight bar */}
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-normal rounded-r" />
            )}

            <div className="flex items-center gap-2 mb-2">
              <span className={[
                'text-caption1 font-mono font-bold tabular-nums px-2 py-0.5 rounded',
                isActive ? 'bg-primary-normal/10 text-primary-normal' : 'bg-fill-normal text-label-assistive',
              ].join(' ')}>
                #{seg.index + 1}
              </span>
              <span className="text-caption1 font-mono text-label-assistive">
                {formatTs(seg.start)} – {formatTs(seg.end)}
              </span>
              {isActive && (
                <span className="flex items-center gap-1.5 text-caption1 text-status-positive font-semibold ml-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-positive animate-pulse" />
                  재생 중
                </span>
              )}
            </div>

            <p className={[
              'leading-relaxed',
              isActive
                ? 'text-headline2 text-label-normal font-semibold'
                : 'text-body1 text-label-normal',
            ].join(' ')}>
              <SpeakerBadge speaker={seg.speaker} />
              {seg.text}
            </p>
            <p
              onClick={handleTranslationClick}
              className={[
                'text-body2 mt-2 cursor-pointer leading-relaxed transition-all select-none',
                showTranslation[seg.index]
                  ? 'text-primary-normal blur-none font-medium'
                  : 'text-label-assistive blur-sm hover:blur-none',
              ].join(' ')}
            >
              {seg.translation}
            </p>
          </div>
        )
      })}
    </div>
  )
}
