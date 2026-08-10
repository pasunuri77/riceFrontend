import { useState } from 'react'
import { NavLink, Link, Navigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, ChevronDown, User as UserIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../ui/NotificationBell'
import PageTransition from '../ui/PageTransition'
import { useDropdown } from '../../hooks/useDropdown'

export default function DashboardShell({ navItems, brandLabel, requireRole, profileTo = '/dashboard/profile' }) {
  const [open, setOpen] = useState(false)
  const profileMenu = useDropdown('profile')
  const { user, logout } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (requireRole && user.role !== requireRole) return <Navigate to="/403" replace />

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
    </div>
  )

  return (
    <div className="min-h-screen bg-primary-50/40 flex">
      <a
        href="#main-content"
        className="sr-only-focusable fixed top-2 left-2 z-[999] bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
      >
        Skip to main content
      </a>
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-black/5 fixed h-full" aria-label="Sidebar navigation">
        {SidebarContent}
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Sidebar navigation"
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
          <button onClick={() => setOpen(true)} aria-label="Open sidebar menu" className="lg:hidden p-2 rounded-lg hover:bg-primary-50">
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="text-sm text-ink/50 hover:text-primary-600 hidden sm:block">← Back to Store</Link>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <div ref={profileMenu.ref} className="relative">
              <button
                onClick={profileMenu.toggle}
                aria-haspopup="menu"
                aria-expanded={profileMenu.isOpen}
                aria-label={`Account menu for ${user.name}`}
                className="flex items-center gap-2 pl-2 border-l border-black/10"
              >
                <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold uppercase">
                  {user.name?.[0]}
                </div>
                <div className="hidden sm:block leading-tight text-left">
                  <p className="text-sm font-semibold capitalize">{user.name}</p>
                  <p className="text-[11px] text-ink/60">{user.role === 'admin' ? 'Administrator' : 'User'}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-ink/40 hidden sm:block transition-transform ${profileMenu.isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {profileMenu.isOpen && (
                  <motion.div role="menu" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute right-0 top-full mt-2 card w-52 p-2 z-40">
                    <Link role="menuitem" to={profileTo} onClick={profileMenu.close} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-primary-50 text-sm font-medium text-ink/70">
                      <UserIcon className="w-4 h-4" /> View Profile
                    </Link>
                    <div className="my-1 border-t border-black/5" />
                    <button role="menuitem" onClick={() => { profileMenu.close(); logout() }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-red-50 text-sm font-medium text-red-500 w-full">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <main id="main-content" className="flex-1 p-4 sm:p-6">
          <PageTransition />
        </main>
      </div>
    </div>
  )
}
