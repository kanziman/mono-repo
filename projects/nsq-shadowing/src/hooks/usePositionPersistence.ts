import { useEffect } from 'react'
import { PositionState } from '@/types'

function savePosition(videoId: string, position: PositionState): void {
  try {
    const key = `shadowing:position:${videoId}`
    localStorage.setItem(key, JSON.stringify(position))
  } catch {
  }
}

function loadPosition(videoId: string, importedAt: string): PositionState | null {
  try {
    const key = `shadowing:position:${videoId}`
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const stored: PositionState = JSON.parse(raw)
    if (stored.importedAt !== importedAt) return null
    return stored
  } catch {
    return null
  }
}

export function usePositionPersistence(
  videoId: string,
  importedAt: string,
  segmentIndex: number,
  onRestore: (index: number) => void
): void {
  useEffect(() => {
    const position = loadPosition(videoId, importedAt)
    if (position !== null) {
      onRestore(position.segmentIndex)
    }
  }, [])

  useEffect(() => {
    savePosition(videoId, { segmentIndex, offset: 0, importedAt })
  }, [segmentIndex])
}
