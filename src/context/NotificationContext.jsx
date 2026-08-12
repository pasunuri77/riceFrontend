import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import orderApi from '../api/orderApi'
import customerApi from '../api/customerApi'
import { buildNotification } from '../utils/notificationTypes'

const NotificationContext = createContext(null)

const MAX_ITEMS = 60
const PAGE_SIZE = 8
const POLL_MS = 45000

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

// Diff a live list of ids against what's already been seen, so a fresh poll only
// reports genuinely NEW rows, never everything that already existed before the
// bell was ever opened.
function diffNewIds(key, currentIds) {
  const raw = localStorage.getItem(key)
  const isFirstRun = raw === null
  const seen = new Set(isFirstRun ? [] : JSON.parse(raw))
  const newIds = currentIds.filter((id) => !seen.has(id))
  currentIds.forEach((id) => seen.add(id))
  localStorage.setItem(key, JSON.stringify([...seen]))
  return { isFirstRun, newIds }
}

// Diff each order's delivery status against its last-known value, so this only
// fires on the instant a status actually *changes* rather than repeating every
// poll while it sits in the same state. Shared by both the admin poll (watching
// for cancellations) and the customer poll (watching for processing/shipped/
// delivered) - same shape, different filter on which transitions matter.
function diffOrderStatusChanges(key, orders) {
  const raw = localStorage.getItem(key)
  const isFirstRun = raw === null
  const prevMap = isFirstRun ? {} : JSON.parse(raw)
  const changes = []
  const nextMap = {}
  orders.forEach((o) => {
    nextMap[o.id] = o.deliveryStatus
    const prevStatus = prevMap[o.id]
    if (!isFirstRun && prevStatus !== undefined && prevStatus !== o.deliveryStatus) {
      changes.push({ order: o, prevStatus, newStatus: o.deliveryStatus })
    }
  })
  localStorage.setItem(key, JSON.stringify(nextMap))
  return { isFirstRun, changes }
}

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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

  // Operational notifications that can't reach this session any other way without
  // a backend push channel: poll the same list endpoints the app already uses,
  // and surface only what's genuinely new/changed since last check. Stand-in for
  // real-time WebSocket/SSE push, which would need a backend change to do properly.
  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    const isAdmin = user.role === 'admin'

    const poll = async () => {
      try {
        if (isAdmin) {
          const [orders, customers] = await Promise.all([orderApi.listAll(), customerApi.list()])
          if (cancelled) return

          const { isFirstRun: firstOrders, newIds } = diffNewIds(`rb_seen_orders_${user.id}`, orders.map((o) => o.id))
          if (!firstOrders) {
            newIds.forEach((id) => {
              const order = orders.find((o) => o.id === id)
              if (order) notify('ADMIN_NEW_ORDER', { orderId: order.id, customerName: order.customerName })
            })
          }

          const { isFirstRun: firstStatus, changes } = diffOrderStatusChanges(`rb_seen_order_status_${user.id}`, orders)
          if (!firstStatus) {
            changes.forEach(({ order, newStatus }) => {
              if (newStatus === 'Cancelled') notify('ADMIN_ORDER_CANCELLED', { orderId: order.id, customerName: order.customerName })
            })
          }

          const { isFirstRun: firstCustomers, newIds: newCustomerIds } = diffNewIds(`rb_seen_customers_${user.id}`, customers.map((c) => c.id))
          if (!firstCustomers) {
            newCustomerIds.forEach((id) => {
              const customer = customers.find((c) => c.id === id)
              notify('ADMIN_NEW_CUSTOMER', { customerId: id, name: customer?.name })
            })
          }
        } else {
          const orders = await orderApi.listMine()
          if (cancelled) return

          const { isFirstRun, changes } = diffOrderStatusChanges(`rb_seen_order_status_${user.id}`, orders)
          if (!isFirstRun) {
            changes.forEach(({ order, newStatus }) => {
              if (newStatus === 'Processing') notify('ORDER_CONFIRMED', { orderId: order.id })
              else if (newStatus === 'Shipped') notify('ORDER_SHIPPED', { orderId: order.id })
              else if (newStatus === 'Delivered') notify('ORDER_DELIVERED', { orderId: order.id })
            })
          }
        }
      } catch {
        /* transient poll failure - just try again next interval */
      }
    }

    poll()
    const interval = setInterval(poll, POLL_MS)
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
