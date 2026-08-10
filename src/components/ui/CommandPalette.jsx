import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Home, ShoppingBag, ShoppingCart, User, LayoutDashboard, Package, Users, ClipboardList, Tag, BarChart3, Settings, CornerDownLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useHomeProducts from '../../hooks/useHomeProducts'

const BASE_COMMANDS = [
  { id: 'home', label: 'Home', to: '/', icon: Home },
  { id: 'shop', label: 'Shop', to: '/products', icon: ShoppingBag },
  { id: 'cart', label: 'Cart', to: '/cart', icon: ShoppingCart },
]

const USER_COMMANDS = [
  { id: 'dashboard', label: 'My Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'My Orders', to: '/dashboard/orders', icon: Package },
  { id: 'profile', label: 'My Profile', to: '/dashboard/profile', icon: User },
]

const ADMIN_COMMANDS = [
  { id: 'admin-dashboard', label: 'Admin Dashboard', to: '/admin', icon: LayoutDashboard },
  { id: 'admin-products', label: 'Manage Products', to: '/admin/products', icon: Package },
  { id: 'admin-customers', label: 'Manage Customers', to: '/admin/customers', icon: Users },
  { id: 'admin-orders', label: 'Manage Orders', to: '/admin/orders', icon: ClipboardList },
  { id: 'admin-coupons', label: 'Manage Coupons', to: '/admin/coupons', icon: Tag },
  { id: 'admin-reports', label: 'Reports', to: '/admin/reports', icon: BarChart3 },
  { id: 'admin-settings', label: 'Store Settings', to: '/admin/settings', icon: Settings },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  // Only ever searches the products actually available in the shop, same as the
  // navbar search and the Home/Shop pages.
  const { products } = useHomeProducts()

  // Global Ctrl/Cmd+K to open from anywhere in the app.
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    const onOpenRequest = () => setOpen(true)
    window.addEventListener('command-palette:open', onOpenRequest)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('command-palette:open', onOpenRequest)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const navCommands = useMemo(() => {
    const list = [...BASE_COMMANDS]
    if (user) list.push(...USER_COMMANDS)
    if (user?.role === 'admin') list.push(...ADMIN_COMMANDS)
    return list
  }, [user])

  const filteredCommands = query
    ? navCommands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : navCommands

  const filteredProducts = query.length > 1
    ? (products || []).filter((p) => `${p.name} ${p.brand}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []

  const results = [
    ...filteredCommands.map((c) => ({ type: 'nav', ...c })),
    ...filteredProducts.map((p) => ({ type: 'product', id: p.id, label: p.name, sub: p.brand, to: `/products/${p.id}` })),
  ]

  const go = (item) => {
    if (!item) return
    navigate(item.to)
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(results.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[activeIndex]) }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg card overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-black/5">
              <Search className="w-4 h-4 text-ink/40" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
                onKeyDown={onKeyDown}
                placeholder="Search products or jump to a page..."
                aria-label="Command palette search"
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <kbd className="hidden sm:block text-[10px] font-semibold text-ink/40 border border-black/10 rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto py-2">
              {results.length === 0 ? (
                <p className="text-sm text-ink/40 text-center py-8">No matches found.</p>
              ) : (
                results.map((item, i) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => go(item)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${i === activeIndex ? 'bg-primary-50 text-primary-700' : 'text-ink/70'}`}
                  >
                    {item.type === 'nav' ? <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" /> : <Search className="w-4 h-4 shrink-0 opacity-50" aria-hidden="true" />}
                    <span className="flex-1 truncate">
                      {item.label}
                      {item.sub && <span className="text-ink/40 font-normal"> · {item.sub}</span>}
                    </span>
                    {i === activeIndex && <CornerDownLeft className="w-3.5 h-3.5 opacity-50" aria-hidden="true" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
