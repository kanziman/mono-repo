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
    <div className="flex flex-col h-full bg-background-normal-normal">
      {/* Header: title + persona tabs */}
      <div className="px-4 py-4 border-b border-line-normal-normal flex-shrink-0 flex flex-col gap-3">
        <p className="text-body2 font-bold text-label-normal">🤖 AI Tutor</p>
        <div className="flex gap-1 bg-background-normal-alternative border border-line-solid-normal p-1 rounded-lg">
          {(['angela', 'mike', 'general'] as Persona[]).map((p) => (
            <Button
              key={p}
              variant={persona === p ? 'solid' : 'outlined'}
              color={persona === p ? 'primary' : 'assistive'}
              size="small"
              className={[
                'flex-1 text-center font-bold transition-all',
                persona === p ? '' : 'border-transparent text-label-alternative'
              ].join(' ')}
              onClick={() => dispatch({ type: 'SET_PERSONA', payload: p })}
            >
              {p === 'angela' ? 'Angela Bot' : p === 'mike' ? 'Mike Bot' : 'General'}
            </Button>
          ))}
        </div>
      </div>

      {/* Message list */}
      <ScrollArea className="flex-1 min-h-0 bg-background-normal-alternative">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center py-20 px-6">
            <p className="text-label-assistive text-body2 text-center leading-relaxed">
              세그먼트를 클릭하거나<br />아래 버튼을 눌러<br />AI 튜터와 대화해보세요.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4 py-4 pr-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={['flex w-full', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
              >
                <div
                  className={[
                    'rounded-2xl px-4 py-2.5 max-w-[85%] text-body2 leading-relaxed shadow-normal-xsmall transition-all',
                    msg.role === 'user'
                      ? 'bg-primary-normal text-white border border-transparent'
                      : 'bg-background-elevated-normal text-label-normal border border-line-normal-normal',
                  ].join(' ')}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </ScrollArea>

      {/* Quick action chips */}
      <div className="flex flex-wrap gap-2 px-4 py-3 bg-background-normal-normal border-t border-line-normal-normal flex-shrink-0">
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
      <div className="flex gap-2 items-center px-4 pb-4 pt-2 bg-background-normal-normal flex-shrink-0">
        <div className="flex-1">
          <TextField
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="메시지 입력..."
            className="w-full"
          />
        </div>
        <Button
          variant="solid"
          color="primary"
          onClick={() => sendMessage(input)}
          disabled={isStreaming || !input.trim()}
          className="flex-shrink-0 h-10 px-4"
        >
          전송
        </Button>
      </div>
    </div>
  )
}
