'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button, Chip, TextField, ScrollArea } from '@ds'
import { usePlayer } from '@/context/PlayerContext'
import { Message, Persona } from '@/types'

interface TutorPanelProps {
  videoId: string
}

export default function TutorPanel({ videoId }: TutorPanelProps) {
  const { state, dispatch } = usePlayer()
  const { segments, currentIndex, persona } = state

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content: string) {
    if (!content.trim()) return

    const userMsg: Message = { role: 'user', content }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)

    const currentSegment = segments[currentIndex]
    const res = await fetch('/api/tutor/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        persona,
        messages: [...messages, userMsg],
        currentSegment,
      }),
    })

    if (!res.ok) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '오류가 발생했습니다.' },
      ])
      setIsStreaming(false)
      return
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = JSON.parse(line.slice('data: '.length))
        if (data.done) {
          setIsStreaming(false)
          break
        }
        if (data.delta) {
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: updated[updated.length - 1].content + data.delta,
            }
            return updated
          })
        }
      }
    }
    setIsStreaming(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Persona tabs */}
      <div className="flex gap-2">
        {(['angela', 'mike', 'general'] as Persona[]).map((p) => (
          <Chip
            key={p}
            selected={persona === p}
            onClick={() => dispatch({ type: 'SET_PERSONA', payload: p })}
          >
            {p === 'angela' ? 'Angela Bot' : p === 'mike' ? 'Mike Bot' : 'General'}
          </Chip>
        ))}
      </div>

      {/* Message list */}
      <ScrollArea className="h-64">
        <div className="flex flex-col gap-2 pr-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
            >
              <span
                className={[
                  'rounded-xl px-3 py-2 max-w-[80%] text-sm',
                  msg.role === 'user'
                    ? 'bg-primary-normal text-static-white'
                    : 'bg-background-elevated-normal text-label-normal',
                ].join(' ')}
              >
                {msg.content}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Quick action chips */}
      <div className="flex flex-wrap gap-2">
        <Chip
          selected={false}
          onClick={() =>
            sendMessage(
              '이 표현을 설명해줘: "' + (segments[currentIndex]?.text ?? '') + '"'
            )
          }
        >
          💡 이 표현 설명해줘
        </Chip>
        <Chip
          selected={false}
          onClick={() => sendMessage('제 영어 문장을 교정해주세요.')}
        >
          ✍ 내 문장 교정해줘
        </Chip>
        <Chip
          selected={false}
          onClick={() => sendMessage('이 주제로 영어 토론을 시작해봐요!')}
        >
          💬 이 주제로 토론하자
        </Chip>
      </div>

      {/* Input area */}
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <TextField
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="메시지 입력..."
          />
        </div>
        <Button
          variant="solid"
          color="primary"
          onClick={() => sendMessage(input)}
          disabled={isStreaming || !input.trim()}
        >
          전송
        </Button>
      </div>
    </div>
  )
}
