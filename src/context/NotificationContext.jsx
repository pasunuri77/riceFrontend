import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const NotificationContext = createContext(null)
const STORAGE_KEY = 'rb_notifications'
const MAX_ITEMS = 30

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

export function NotificationProvider({ children }) {
  const [items, setItems] = useState(load)

  useEffect(() => persist(items), [items])

  const push = useCallback((message, type = 'info') => {
    setItems((current) => [
      { id: Date.now() + Math.random(), message, type, read: false, at: new Date().toISOString() },
      ...current,
    ].slice(0, MAX_ITEMS))
  }, [])

  // Toasts across the app also land here so users have a persistent history of what happened.
  useEffect(() => {
    const onNotify = (e) => push(e.detail?.message, e.detail?.type)
    window.addEventListener('app:notify', onNotify)
    return () => window.removeEventListener('app:notify', onNotify)
  }, [push])

  const markAllRead = () => setItems((current) => current.map((n) => ({ ...n, read: true })))
  const clearAll = () => setItems([])
  const unreadCount = items.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider value={{ items, push, markAllRead, clearAll, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
