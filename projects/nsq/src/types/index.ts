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

export type StepStatus = 'pending' | 'in_progress' | 'done' | 'error'

export interface IncompleteEpisodeEntry {
  videoId: string
  complete: false
  steps: { download: StepStatus; subtitle: StepStatus; translate: StepStatus }
  error: string | null
  startedAt: string
}

export type EpisodeEntry = (EpisodeMeta & { complete: true }) | IncompleteEpisodeEntry

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
