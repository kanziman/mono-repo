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
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-3">
        <p className="text-display2 text-label-normal">{seg.text}</p>
        <p
          onClick={handleTranslationClick}
          className={[
            'text-label-alternative cursor-pointer',
            showTranslation[seg.index] ? '' : 'blur-sm hover:blur-none',
          ].join(' ')}
        >
          {seg.translation}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="solid" color="primary" onClick={playOriginal}>
          원본 재생
        </Button>

        {!isRecordingSupported ? (
          <Button variant="outlined" color="assistive" disabled>
            녹음 미지원
          </Button>
        ) : !isRecording ? (
          <Button variant="outlined" color="primary" onClick={startRecording}>
            녹음 시작
          </Button>
        ) : (
          <Button variant="outlined" color="negative" onClick={stopRecording}>
            녹음 중지
          </Button>
        )}
      </div>

      {recordedUrl && (
        <audio controls src={recordedUrl} className="w-full" />
      )}

      <div className="flex gap-3">
        <Button
          variant="outlined"
          color="assistive"
          onClick={() => dispatch({ type: 'PREV' })}
        >
          이전
        </Button>
        <Button
          variant="outlined"
          color="assistive"
          onClick={() => dispatch({ type: 'NEXT' })}
        >
          다음
        </Button>
      </div>
    </div>
  )
}
