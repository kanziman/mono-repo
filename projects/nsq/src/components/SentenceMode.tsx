'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@ds'
import { usePlayer } from '@/context/PlayerContext'

interface SentenceModeProps {
  audioRef: React.RefObject<HTMLAudioElement>
  videoId: string
}

const isRecordingSupported =
  typeof MediaRecorder !== 'undefined' && typeof window !== 'undefined'

export default function SentenceMode({ audioRef, videoId: _videoId }: SentenceModeProps) {
  const { state, dispatch } = usePlayer()
  const { segments, currentIndex, showTranslation } = state
  const seg = segments[currentIndex]

  const [isRecording, setIsRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    return () => {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
    }
  }, [recordedUrl])

  if (!seg) return null

  const playOriginal = () => {
    audioRef.current!.currentTime = seg.start
    audioRef.current!.play()
    dispatch({ type: 'SET_PLAYING', payload: true })
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    const chunks: BlobPart[] = []
    recorder.ondataavailable = (e) => chunks.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' })
      setRecordedUrl(URL.createObjectURL(blob))
      stream.getTracks().forEach((t) => t.stop())
    }
    recorder.start()
    recorderRef.current = recorder
    setIsRecording(true)
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    recorderRef.current = null
    setIsRecording(false)
  }

  const handleTranslationClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'TOGGLE_TRANSLATION', payload: seg.index })
  }

  return (
    <div className="flex flex-col h-full bg-background-normal-alternative">
      {/* 메인 콘텐츠: 이전/현재/다음 세그먼트 */}
      <div className="flex flex-col flex-1 overflow-hidden justify-between py-6">
        {/* 이전 세그먼트 컨텍스트 */}
        {prevSeg ? (
          <div className="px-10 pb-2 opacity-30 pointer-events-none select-none">
            <p className="text-body2 text-label-alternative text-center line-clamp-1">{prevSeg.text}</p>
          </div>
        ) : (
          <div className="h-6" />
        )}

        {/* 현재 세그먼트 — 중앙 집중 솔리드 카드 */}
        <div className="flex items-center justify-center px-6">
          <div className="w-full max-w-[680px] bg-background-elevated-normal border border-line-normal-normal rounded-2xl p-10 shadow-normal-large flex flex-col items-center justify-center gap-6 text-center transition-all">
            <div className="flex items-center gap-2">
              <Badge variant="outlined" color="primary" size="small">
                {seg.index + 1} / {segments.length}
              </Badge>
              <span className="text-caption1 text-label-assistive font-mono font-semibold">
                {formatTs(seg.start)} – {formatTs(seg.end)}
              </span>
            </div>

            <p className="text-title3 text-label-normal font-bold leading-relaxed max-w-prose">
              {seg.text}
            </p>

            <p
              onClick={handleTranslationClick}
              className={[
                'text-body1 cursor-pointer select-none transition-all leading-relaxed max-w-prose',
                showTranslation[seg.index]
                  ? 'text-primary-normal blur-none font-medium'
                  : 'text-label-assistive blur-sm hover:blur-none',
              ].join(' ')}
            >
              {seg.translation}
            </p>
          </div>
        </div>

        {/* 다음 세그먼트 컨텍스트 */}
        {nextSeg ? (
          <div className="px-10 pt-2 opacity-30 pointer-events-none select-none">
            <p className="text-body2 text-label-alternative text-center line-clamp-1">{nextSeg.text}</p>
          </div>
        ) : (
          <div className="h-6" />
        )}
      </div>

      {/* 하단 고정 액션 바 */}
      <div className="flex-shrink-0 border-t border-line-normal-normal bg-background-elevated-normal px-6 py-5 flex flex-col gap-4 shadow-normal-medium">
        {/* 이전 / 원본 재생 / 다음 */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outlined" color="assistive" size="medium"
            onClick={() => dispatch({ type: 'PREV' })}>
            ◀ 이전
          </Button>
          <Button variant="solid" color="primary" size="large" className="min-w-[140px]" onClick={playOriginal}>
            ▶ 원본 재생
          </Button>
          <Button variant="outlined" color="assistive" size="medium"
            onClick={() => dispatch({ type: 'NEXT' })}>
            다음 ▶
          </Button>
        </div>

        {/* 녹음 제어부 */}
        <div className="flex flex-col gap-3 items-center max-w-[480px] mx-auto w-full">
          {!isRecordingSupported ? (
            <Button variant="outlined" color="assistive" size="medium" disabled className="w-full">
              녹음 미지원
            </Button>
          ) : !isRecording ? (
            <Button variant="outlined" color="primary" size="medium" className="w-full" onClick={startRecording}>
              ⏺ 녹음 시작
            </Button>
          ) : (
            <Button variant="solid" color="negative" size="medium" className="w-full animate-pulse" onClick={stopRecording}>
              ⏹ 녹음 중 — 클릭하여 중지
            </Button>
          )}

          {recordedUrl && (
            <div className="w-full bg-fill-normal border border-line-solid-normal rounded-xl p-4 flex flex-col gap-2 transition-all">
              <span className="text-caption1 text-label-alternative font-semibold">내 녹음 음성</span>
              <audio controls src={recordedUrl} className="w-full h-10 rounded-lg bg-background-normal-normal" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
