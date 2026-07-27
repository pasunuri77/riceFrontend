import { useState } from 'react'
import { NavLink, Outlet, Link, Navigate } from 'react-router-dom'
import { Menu, X, Bell, LogOut, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

export default function DashboardShell({ navItems, brandLabel, requireRole }) {
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { user, logout } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (requireRole && user.role !== requireRole) return <Navigate to="/dashboard" replace />

  const notifications = [
    { id: 1, text: 'Your order ORD10236 has been shipped.', time: '2h ago' },
    { id: 2, text: 'Weekend offer: Flat 10% off on Basmati rice.', time: '1d ago' },
    { id: 3, text: 'New arrival: Gobindobhog Fragrant Rice.', time: '3d ago' },
  ]

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-black/5 shrink-0">
        <span className="text-2xl">🌾</span>
        <div>
          <p className="font-display font-extrabold text-primary-700 leading-none">RiceBazaar</p>
          <p className="text-[10px] text-ink/40 mt-0.5">{brandLabel}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive ? 'bg-primary-500 text-white shadow-card' : 'text-ink/60 hover:bg-primary-50 hover:text-primary-700'
              }`
            }
          >
            <item.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-black/5">
        <button onClick={logout} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 w-full">
          <LogOut className="w-[18px] h-[18px]" /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-primary-50/40 flex">
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-black/5 fixed h-full">
        {SidebarContent}
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-0 h-full w-72 bg-white"
            >
              {SidebarContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-black/5 flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-30">
          <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-primary-50">
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="text-sm text-ink/50 hover:text-primary-600 hidden sm:block">← Back to Store</Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setNotifOpen((v) => !v)} className="relative p-2 rounded-lg hover:bg-primary-50">
                <Bell className="w-5 h-5 text-ink/70" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute right-0 top-full mt-2 card w-72 p-2 z-40">
                    <p className="text-xs font-bold text-ink/40 uppercase px-2 py-1">Notifications</p>
                    {notifications.map((n) => (
                      <div key={n.id} className="px-2.5 py-2 rounded-lg hover:bg-primary-50 text-sm">
                        <p className="text-ink/80">{n.text}</p>
                        <p className="text-[11px] text-ink/35 mt-0.5">{n.time}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-black/10">
              <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold uppercase">
                {user.name?.[0]}
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-semibold capitalize">{user.name}</p>
                <p className="text-[11px] text-ink/40">{user.role === 'admin' ? 'Administrator' : 'User'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-ink/40 hidden sm:block" />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
