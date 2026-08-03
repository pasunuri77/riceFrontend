import { useEffect, useRef } from 'react'

const IDLE_LIMIT_MS = 30 * 60 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']

export default function useIdleLogout(enabled, onIdle) {
  const timerRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const reset = () => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(onIdle, IDLE_LIMIT_MS)
    }

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, reset))
    reset()

    return () => {
      clearTimeout(timerRef.current)
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, reset))
    }
  }, [enabled, onIdle])
}
