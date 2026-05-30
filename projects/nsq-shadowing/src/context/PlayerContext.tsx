'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { Segment, Persona } from '@/types'

interface PlayerState {
  segments: Segment[]
  currentIndex: number
  isPlaying: boolean
  mode: 'immersion' | 'sentence'
  persona: Persona
  showTranslation: boolean[]
}

type PlayerAction =
  | { type: 'SET_SEGMENTS'; payload: Segment[] }
  | { type: 'SET_INDEX'; payload: number }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'TOGGLE_MODE' }
  | { type: 'TOGGLE_TRANSLATION'; payload: number }
  | { type: 'SET_PERSONA'; payload: Persona }

const initialState: PlayerState = {
  segments: [],
  currentIndex: 0,
  isPlaying: false,
  mode: 'immersion',
  persona: 'general',
  showTranslation: [],
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'SET_SEGMENTS':
      return {
        ...state,
        segments: action.payload,
        showTranslation: Array(action.payload.length).fill(false),
      }
    case 'SET_INDEX':
      return {
        ...state,
        currentIndex: clamp(action.payload, 0, Math.max(0, state.segments.length - 1)),
      }
    case 'NEXT':
      return {
        ...state,
        currentIndex: clamp(state.currentIndex + 1, 0, Math.max(0, state.segments.length - 1)),
      }
    case 'PREV':
      return {
        ...state,
        currentIndex: clamp(state.currentIndex - 1, 0, Math.max(0, state.segments.length - 1)),
      }
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload }
    case 'TOGGLE_MODE':
      return { ...state, mode: state.mode === 'immersion' ? 'sentence' : 'immersion' }
    case 'TOGGLE_TRANSLATION': {
      const updated = [...state.showTranslation]
      updated[action.payload] = !updated[action.payload]
      return { ...state, showTranslation: updated }
    }
    case 'SET_PERSONA':
      return { ...state, persona: action.payload }
    default:
      return state
  }
}

interface PlayerContextValue {
  state: PlayerState
  dispatch: React.Dispatch<PlayerAction>
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState)
  return (
    <PlayerContext.Provider value={{ state, dispatch }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider')
  }
  return context
}
