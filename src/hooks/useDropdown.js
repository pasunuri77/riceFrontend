import { useCallback, useEffect, useRef, useState } from 'react'

// Module-level so any dropdown anywhere in the app (Notifications, Profile menu,
// future Search/Settings popovers, ...) shares one "which one is open" slot -
// opening one always closes whichever other one was open, with no provider needed.
const listeners = new Set()
let activeId = null

function setActive(id) {
  activeId = id
  listeners.forEach((listen) => listen(activeId))
}

/**
 * Click-to-toggle dropdown/popover with outside-click and Escape-to-close,
 * coordinated so only one registered dropdown is open at a time.
 * Attach the returned `ref` to the dropdown's outer (position: relative) container.
 */
export function useDropdown(id) {
  const [isOpen, setIsOpen] = useState(activeId === id)
  const ref = useRef(null)

  useEffect(() => {
    const listen = (current) => setIsOpen(current === id)
    listeners.add(listen)
    return () => listeners.delete(listen)
  }, [id])

  const open = useCallback(() => setActive(id), [id])
  const close = useCallback(() => {
    if (activeId === id) setActive(null)
  }, [id])
  const toggle = useCallback(() => {
    setActive(activeId === id ? null : id)
  }, [id])

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) close()
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') close()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, close])

  return { ref, isOpen, open, close, toggle }
}
