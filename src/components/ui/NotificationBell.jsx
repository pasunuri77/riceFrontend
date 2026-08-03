import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { items, markAllRead, clearAll, unreadCount } = useNotifications() || {}

  if (!items) return null

  return (
    <div className="relative" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className="relative p-2 rounded-lg hover:bg-primary-50"
      >
        <Bell className="w-5 h-5 text-ink/70" aria-hidden="true" />
        {unreadCount > 0 && (
          <span aria-hidden="true" className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              role="dialog"
              aria-label="Notifications"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute right-0 top-full mt-2 card w-80 max-w-[90vw] p-0 z-40 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
                <p className="font-semibold text-sm">Notifications</p>
                <div className="flex items-center gap-1">
                  <button onClick={markAllRead} aria-label="Mark all as read" title="Mark all read" className="p-1.5 rounded-lg hover:bg-primary-50 text-ink/50">
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button onClick={clearAll} aria-label="Clear all notifications" title="Clear all" className="p-1.5 rounded-lg hover:bg-red-50 text-ink/50 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="text-sm text-ink/60 text-center py-8">No notifications yet</p>
                ) : (
                  items.map((n) => (
                    <div key={n.id} className={`px-4 py-3 border-b border-black/5 last:border-0 ${n.read ? '' : 'bg-primary-50/50'}`}>
                      <p className="text-sm font-medium">{n.message}</p>
                      <p className="text-[11px] text-ink/60 mt-0.5">{timeAgo(n.at)}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
