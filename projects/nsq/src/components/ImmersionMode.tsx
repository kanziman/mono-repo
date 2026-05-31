'use client'

import React, { useRef, useEffect } from 'react'
import { usePlayer } from '@/context/PlayerContext'

function formatTs(s: number | undefined) {
  if (s == null || isNaN(s)) return '--:--'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
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
    <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-1.5 m-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
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

        const speakerLabel = seg.text.startsWith('Angela')
          ? <span className="inline-block text-[10px] font-extrabold px-[7px] py-[1px] rounded mr-1.5 align-middle bg-[#0c2f52] text-[#7dd3fc] border border-[#1e4a7a]">Angela</span>
          : seg.text.startsWith('Mike')
          ? <span className="inline-block text-[10px] font-extrabold px-[7px] py-[1px] rounded mr-1.5 align-middle bg-[#431407] text-[#fdba74] border border-[#7c2d12]">Mike</span>
          : null

        return (
          <div
            key={seg.index}
            ref={(el) => { itemRefs.current[seg.index] = el }}
            onClick={handleSegmentClick}
            className={[
              'px-3 py-2.5 rounded mb-0.5 cursor-pointer transition-colors border-l-[3px]',
              isActive
                ? 'bg-[#1e3a5f] border-l-[#3b82f6]'
                : 'bg-transparent border-l-transparent hover:bg-[#1a2744]',
            ].join(' ')}
          >
            <div className="text-[10px] text-[#64748b] font-mono mb-1">
              #{seg.index + 1} · {formatTs(seg.start)}–{formatTs(seg.end)}
              {isActive && <span className="ml-2">▶ 재생 중</span>}
            </div>
            <p className={isActive ? 'text-[#f8fafc] font-semibold text-sm leading-relaxed' : 'text-[#e2e8f0] text-sm leading-relaxed'}>
              {speakerLabel}{seg.text}
            </p>
            <p
              onClick={handleTranslationClick}
              className={[
                'text-[12px] mt-1 cursor-pointer leading-relaxed transition-all select-none',
                showTranslation[seg.index]
                  ? 'text-[#7dd3fc]'
                  : 'text-[#94a3b8] blur-sm hover:blur-none',
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
