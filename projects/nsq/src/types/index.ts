export interface Segment {
  index: number
  start: number
  end: number
  text: string
  translation: string
}

export interface EpisodeMeta {
  videoId: string
  title: string
  durationSec: number
  thumbnailUrl: string
  importedAt: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export type Persona = 'angela' | 'mike' | 'general'

export type ImportStep = 'download' | 'subtitle' | 'translate'

export interface ImportProgress {
  step: ImportStep
  progress: number
  done: boolean
  error?: string
}

export interface PositionState {
  segmentIndex: number
  offset: number
  importedAt: string
}
