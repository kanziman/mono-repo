import { useEffect } from 'react'

interface KeyHandlers {
  onSpace?: () => void
  onR?: () => void
  onN?: () => void
  onP?: () => void
  onT?: () => void
  onM?: () => void
}

export function useKeyboardShortcuts(handlers: KeyHandlers): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      switch (event.key) {
        case ' ':
          event.preventDefault()
          handlers.onSpace?.()
          break
        case 'r':
          handlers.onR?.()
          break
        case 'n':
          handlers.onN?.()
          break
        case 'p':
          handlers.onP?.()
          break
        case 't':
          handlers.onT?.()
          break
        case 'm':
          handlers.onM?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlers])
}
