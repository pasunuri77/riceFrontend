import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import orderApi from '../api/orderApi'
import productApi from '../api/productApi'
import customerApi from '../api/customerApi'
import { buildNotification } from '../utils/notificationTypes'
import { LOW_STOCK_THRESHOLD } from '../utils/stock'

const NotificationContext = createContext(null)

const MAX_ITEMS = 60
const PAGE_SIZE = 8
const LARGE_ORDER_THRESHOLD = 10000
const ADMIN_POLL_MS = 45000

const storageKey = (userId) => `rb_notifications_${userId}`

function loadItems(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return null // null = read failed (corrupt data / storage unavailable), distinct from "empty"
  }
}

function persistItems(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    /* storage full/unavailable - notification still lives in memory for this session */
  }
}

// Diff a live list of ids against what this admin has already seen, so a fresh
// poll only reports genuinely NEW rows, never everything that already existed
// before the admin ever opened the notification bell.
function diffNewIds(key, currentIds) {
  const raw = localStorage.getItem(key)
  const isFirstRun = raw === null
  const seen = new Set(isFirstRun ? [] : JSON.parse(raw))
  const newIds = currentIds.filter((id) => !seen.has(id))
  currentIds.forEach((id) => seen.add(id))
  localStorage.setItem(key, JSON.stringify([...seen]))
  return { isFirstRun, newIds }
}

// Diff stock levels against last-known values, so this only fires the instant
// a product *crosses* into low/out-of-stock rather than repeating every poll
// while it stays there.
function diffStockCrossings(key, products) {
  const raw = localStorage.getItem(key)
  const isFirstRun = raw === null
  const prevMap = isFirstRun ? {} : JSON.parse(raw)
  const crossings = []
  const nextMap = {}
  products.forEach((p) => {
    nextMap[p.id] = p.stock
    const prevStock = prevMap[p.id]
    if (!isFirstRun && prevStock !== undefined) {
      if (p.stock === 0 && prevStock > 0) crossings.push({ product: p, kind: 'out' })
      else if (p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD && prevStock >= LOW_STOCK_THRESHOLD) crossings.push({ product: p, kind: 'low' })
    }
  })
  localStorage.setItem(key, JSON.stringify(nextMap))
  return { isFirstRun, crossings }
}

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const prevUserId = useRef(undefined)

  // Reload from this specific user's slice of storage whenever who's logged in
  // changes - a customer must never see an admin's notifications or vice versa,
  // and switching accounts on the same browser must not leak the previous one.
  useEffect(() => {
    if (!user) { setItems([]); setLoading(false); setError(false); return }
    setLoading(true)
    const loaded = loadItems(storageKey(user.id))
    setError(loaded === null)
    setItems(loaded || [])
    setVisibleCount(PAGE_SIZE)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (user) persistItems(storageKey(user.id), items)
  }, [items, user?.id])

  const notify = useCallback((typeKey, params) => {
    if (!user) return
    setItems((current) => [buildNotification(typeKey, params, { userId: user.id, role: user.role }), ...current].slice(0, MAX_ITEMS))
  }, [user])

  // Any null->user (or userA->userB) transition is a genuine sign-in - fire the
  // security notification. Guarded so it never fires on page-load hydration of
  // an already-persisted session (that would spam "New login" on every refresh).
  useEffect(() => {
    const currentId = user?.id ?? null
    if (prevUserId.current !== undefined && prevUserId.current !== currentId && user) {
      notify(user.role === 'admin' ? 'ADMIN_LOGIN' : 'ACCOUNT_LOGIN', {})
    }
    prevUserId.current = currentId
  }, [user?.id, notify])

  // Operational notifications an admin can't get any other way without a backend
  // push channel: poll the same list endpoints the admin pages already use, and
  // surface what's new since last check. This is a stand-in for real-time
  // WebSocket/SSE push, which would need a backend change to do properly.
  useEffect(() => {
    if (!user || user.role !== 'admin') return undefined
    let cancelled = false

    const poll = async () => {
      try {
        const [orders, customers, products] = await Promise.all([
          orderApi.listAll(), customerApi.list(), productApi.list(),
        ])
        if (cancelled) return

        const { isFirstRun: firstOrders, newIds: newOrderIds } = diffNewIds(`rb_seen_orders_${user.id}`, orders.map((o) => o.id))
        if (!firstOrders) {
          newOrderIds.forEach((id) => {
            const order = orders.find((o) => o.id === id)
            if (!order) return
            notify('ADMIN_NEW_ORDER', { customerName: order.customerName })
            if (order.amount >= LARGE_ORDER_THRESHOLD) notify('ADMIN_LARGE_ORDER', { amount: order.amount })
          })
        }

        const { isFirstRun: firstCustomers, newIds: newCustomerIds } = diffNewIds(`rb_seen_customers_${user.id}`, customers.map((c) => c.id))
        if (!firstCustomers) {
          newCustomerIds.forEach((id) => {
            const customer = customers.find((c) => c.id === id)
            notify('ADMIN_NEW_CUSTOMER', { name: customer?.name })
          })
        }

        const { crossings } = diffStockCrossings(`rb_seen_stock_${user.id}`, products)
        crossings.forEach(({ product, kind }) => {
          if (kind === 'out') notify('ADMIN_OUT_OF_STOCK', { productName: product.name })
          else notify('ADMIN_LOW_STOCK', { productName: product.name, threshold: LOW_STOCK_THRESHOLD })
        })
      } catch {
        /* transient poll failure - just try again next interval */
      }
    }

    poll()
    const interval = setInterval(poll, ADMIN_POLL_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [user?.id, user?.role, notify])

  const markRead = useCallback((id) => {
    setItems((current) => current.map((n) => (n.id === id ? { ...n, isRead: true, updatedAt: new Date().toISOString() } : n)))
  }, [])
  const markAllRead = useCallback(() => {
    setItems((current) => current.map((n) => (n.isRead ? n : { ...n, isRead: true, updatedAt: new Date().toISOString() })))
  }, [])
  const remove = useCallback((id) => {
    setItems((current) => current.filter((n) => n.id !== id))
  }, [])
  const clearAll = useCallback(() => setItems([]), [])
  const loadMore = useCallback(() => setVisibleCount((v) => v + PAGE_SIZE), [])
  const retry = useCallback(() => {
    if (!user) return
    setLoading(true)
    const loaded = loadItems(storageKey(user.id))
    setError(loaded === null)
    setItems(loaded || [])
    setLoading(false)
  }, [user])

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount])
  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items])
  const hasMore = visibleCount < items.length

  const value = {
    items: visibleItems,
    allCount: items.length,
    unreadCount,
    loading,
    error,
    hasMore,
    loadMore,
    retry,
    notify,
    markRead,
    markAllRead,
    remove,
    clearAll,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotifications = () => useContext(NotificationContext)
