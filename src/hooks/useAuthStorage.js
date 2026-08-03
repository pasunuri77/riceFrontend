import { useEffect, useState } from 'react'
import { getSessionStore } from '../utils/rememberMe'

const KEY = 'rb_user'

export default function useAuthStorage() {
  const [value, setValue] = useState(() => {
    try {
      const stored = getSessionStore().getItem(KEY) || localStorage.getItem(KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      const store = getSessionStore()
      if (value) {
        store.setItem(KEY, JSON.stringify(value))
      } else {
        localStorage.removeItem(KEY)
        sessionStorage.removeItem(KEY)
      }
    } catch {
      /* ignore */
    }
  }, [value])

  return [value, setValue]
}
