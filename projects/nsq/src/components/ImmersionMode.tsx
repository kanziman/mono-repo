'use client'

import React, { useRef, useEffect } from 'react'
import { Badge } from '@ds'
import { usePlayer } from '@/context/PlayerContext'

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
    <div className="flex flex-col gap-2 p-4">
      {segments.map((seg) => {
        const isActive = seg.index === currentIndex

        const handleSegmentClick = () => {
          dispatch({ type: 'SET_INDEX', payload: seg.index })
          audioRef.current!.currentTime = seg.start
          audioRef.current!.play()
          dispatch({ type: 'SET_PLAYING', payload: true })
        }

        const handleTranslationClick = (e: React.MouseEvent) => {
          e.stopPropagation()
          dispatch({ type: 'TOGGLE_TRANSLATION', payload: seg.index })
        }

        const speakerBadge = seg.text.startsWith('Angela')
          ? <Badge>Angela</Badge>
          : seg.text.startsWith('Mike')
          ? <Badge>Mike</Badge>
          : null

        return (
          <div
            key={seg.index}
            ref={(el) => { itemRefs.current[seg.index] = el }}
            onClick={handleSegmentClick}
            className={[
              'rounded-xl p-2 cursor-pointer transition-all',
              isActive
                ? 'border-2 border-primary-normal bg-fill-strong'
                : 'border border-line-normal-normal bg-background-elevated-normal hover:bg-fill-normal',
            ].join(' ')}
          >
            {speakerBadge && <div className="mb-1">{speakerBadge}</div>}
            <p className="text-label-normal mb-1">{seg.text}</p>
            <p
              onClick={handleTranslationClick}
              className={[
                'text-label-alternative cursor-pointer text-sm',
                showTranslation[seg.index] ? '' : 'blur-sm hover:blur-none',
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
