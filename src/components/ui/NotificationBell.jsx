import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell, CheckCheck, Trash2, X, AlertCircle,
  Package, PackageCheck, PackagePlus, Truck, CheckCircle2, XCircle,
  CreditCard, AlertTriangle, RotateCcw, Tag, Percent, User, ShieldCheck,
  LogIn, ClipboardList, TrendingUp, Users, Star,
} from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { useDropdown } from '../../hooks/useDropdown'

const ICONS = {
  Package, PackageCheck, PackagePlus, Truck, CheckCircle2, XCircle,
  CreditCard, AlertTriangle, RotateCcw, Tag, Percent, User, ShieldCheck,
  LogIn, ClipboardList, TrendingUp, Users, Star,
}

// Left accent + icon tint by priority - Critical/High notifications need to read as
// urgent at a glance, not just blend into a flat list.
const PRIORITY_STYLES = {
  critical: { border: 'border-l-red-500', iconBg: 'bg-red-100 text-red-600', badge: 'bg-red-500' },
  high: { border: 'border-l-amber-500', iconBg: 'bg-amber-100 text-amber-600', badge: 'bg-amber-500' },
  medium: { border: 'border-l-primary-400', iconBg: 'bg-primary-100 text-primary-600', badge: 'bg-primary-500' },
  low: { border: 'border-l-transparent', iconBg: 'bg-black/5 text-ink/50', badge: 'bg-ink/30' },
}

function timeAgo(iso) {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' })
}

function NotificationRow({ n, onOpen, onRemove, rowRef, onKeyDown }) {
  const Icon = ICONS[n.icon] || Bell
  const style = PRIORITY_STYLES[n.priority] || PRIORITY_STYLES.low

  return (
    <div
      ref={rowRef}
      role="option"
      aria-selected="false"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onClick={() => onOpen(n)}
      className={`group relative flex gap-3 px-4 py-3 border-b border-l-4 border-black/5 last:border-b-0 cursor-pointer outline-none focus-visible:bg-primary-50/70 ${style.border} ${n.isRead ? '' : 'bg-primary-50/40'}`}
    >
      <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${style.iconBg}`} aria-hidden="true">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${n.isRead ? 'font-medium text-ink/80' : 'font-semibold text-ink'}`}>{n.title}</p>
          {!n.isRead && <span aria-label="Unread" className={`mt-1 w-2 h-2 rounded-full shrink-0 ${style.badge}`} />}
        </div>
        <p className="text-xs text-ink/60 mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-[11px] text-ink/40 mt-1">{timeAgo(n.createdAt)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(n.id) }}
        aria-label="Delete notification"
        title="Delete"
        className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 self-start p-1 rounded hover:bg-red-50 text-ink/30 hover:text-red-500 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function NotificationBell() {
  const { ref, isOpen, toggle, close } = useDropdown('notifications')
  const notifications = useNotifications()
  const navigate = useNavigate()
  const rowRefs = useRef([])

  if (!notifications) return null
  const { items, allCount, unreadCount, loading, error, hasMore, loadMore, retry, markRead, markAllRead, remove, clearAll } = notifications

  const openNotification = (n) => {
    markRead(n.id)
    close()
    if (n.actionUrl) navigate(n.actionUrl)
  }

  const focusRow = (index) => {
    const el = rowRefs.current[index]
    if (el) el.focus()
  }

  const handleRowKeyDown = (e, index) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); focusRow(Math.min(index + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusRow(Math.max(index - 1, 0)) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNotification(items[index]) }
  }

  // Move keyboard focus into the list as soon as it opens, so arrow-key navigation
  // works immediately instead of requiring an extra Tab press first.
  useEffect(() => {
    if (isOpen && !loading && items.length > 0) {
      const t = setTimeout(() => focusRow(0), 0)
      return () => clearTimeout(t)
    }
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loading])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className="relative p-2 rounded-lg hover:bg-primary-50"
      >
        <Bell className="w-5 h-5 text-ink/70" aria-hidden="true" />
        {unreadCount > 0 && (
          <span aria-hidden="true" className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute right-0 top-full mt-2 card w-80 max-w-[90vw] p-0 z-40 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 shrink-0">
              <p className="font-semibold text-sm">
                Notifications {unreadCount > 0 && <span className="text-primary-600">({unreadCount})</span>}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={markAllRead} disabled={unreadCount === 0} aria-label="Mark all as read" title="Mark all read" className="p-1.5 rounded-lg hover:bg-primary-50 text-ink/50 disabled:opacity-30 disabled:pointer-events-none">
                  <CheckCheck className="w-4 h-4" />
                </button>
                <button onClick={clearAll} disabled={allCount === 0} aria-label="Clear all notifications" title="Clear all" className="p-1.5 rounded-lg hover:bg-red-50 text-ink/50 hover:text-red-500 disabled:opacity-30 disabled:pointer-events-none">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div role="listbox" aria-label="Notification list" className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading notifications">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-black/10 shrink-0" />
                      <div className="flex-1 space-y-2 py-0.5">
                        <div className="h-2.5 w-3/4 bg-black/10 rounded" />
                        <div className="h-2 w-full bg-black/5 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-ink/60 mb-3">Couldn't load notifications.</p>
                  <button onClick={retry} className="text-xs font-semibold text-primary-600 hover:underline">Try again</button>
                </div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-6 h-6 text-ink/20 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-ink/50">You're all caught up</p>
                </div>
              ) : (
                <>
                  {items.map((n, i) => (
                    <NotificationRow
                      key={n.id}
                      n={n}
                      onOpen={openNotification}
                      onRemove={remove}
                      rowRef={(el) => { rowRefs.current[i] = el }}
                      onKeyDown={(e) => handleRowKeyDown(e, i)}
                    />
                  ))}
                  {hasMore && (
                    <button onClick={loadMore} className="w-full py-2.5 text-xs font-semibold text-primary-600 hover:bg-primary-50">
                      Load more
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
