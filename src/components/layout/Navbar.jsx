import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, Heart, ShoppingCart, User, Menu, X, LayoutDashboard, Scale } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useCompare } from '../../context/CompareContext'
import { useAuth } from '../../context/AuthContext'
import productApi from '../../api/productApi'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [products, setProducts] = useState([])
  const { count } = useCart()
  const { wishlist } = useWishlist()
  const { compareList } = useCompare()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => setOpen(false), [])
  useEffect(() => { productApi.list().then(setProducts).catch(() => setProducts([])) }, [])

  const results = query.length > 1
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []

  const submitSearch = (e) => {
    e.preventDefault()
    navigate(`/products?search=${encodeURIComponent(query)}`)
    setShowResults(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-black/5">
      <div className="container-app flex items-center gap-4 h-16">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🌾</span>
          <span className="font-display font-extrabold text-lg text-primary-700">RiceBazaar</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-semibold transition ${isActive ? 'text-primary-600 bg-primary-50' : 'text-ink/70 hover:text-primary-600 hover:bg-primary-50'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="relative hidden md:block flex-1 max-w-md ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/35" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Search rice brands, categories..."
            className="input-field pl-9"
          />
          <AnimatePresence>
            {showResults && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute top-full mt-2 left-0 right-0 card p-2 max-h-96 overflow-y-auto"
              >
                {results.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50"
                  >
                    <img src={p.image} className="w-10 h-10 rounded-md object-cover" alt="" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-ink/40">{p.brand}</p>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className="flex items-center gap-1 ml-auto md:ml-0">
          <Link to="/compare" className="relative p-2 rounded-lg hover:bg-primary-50 hidden sm:inline-flex" title="Compare">
            <Scale className="w-5 h-5 text-ink/70" />
            {compareList.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center">{compareList.length}</span>
            )}
          </Link>
          <Link to="/wishlist" className="relative p-2 rounded-lg hover:bg-primary-50" title="Wishlist">
            <Heart className="w-5 h-5 text-ink/70" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center">{wishlist.length}</span>
            )}
          </Link>
          <Link to="/cart" className="relative p-2 rounded-lg hover:bg-primary-50" title="Cart">
            <ShoppingCart className="w-5 h-5 text-ink/70" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center">{count}</span>
            )}
          </Link>

          {user ? (
            <div className="relative group hidden sm:block">
              <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-primary-50">
                <div className="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold uppercase">
                  {user.name?.[0]}
                </div>
                <span className="text-sm font-semibold capitalize">{user.name}</span>
              </button>
              <div className="absolute right-0 top-full pt-2 hidden group-hover:block">
                <div className="card p-2 w-48">
                  <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary-50 text-sm">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link to="/dashboard/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary-50 text-sm">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <button onClick={logout} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-500">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <Link to="/login" className="btn-outline text-sm py-2">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-2">Register</Link>
            </div>
          )}

          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-primary-50 lg:hidden">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-72 bg-white p-5 flex flex-col gap-1"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-display font-bold text-primary-700">Menu</span>
                <button onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              {LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-primary-50 font-medium text-sm">
                  {l.label}
                </NavLink>
              ))}
              <div className="border-t border-black/5 my-2" />
              {user ? (
                <>
                  <NavLink to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-primary-50 font-medium text-sm">Dashboard</NavLink>
                  <button onClick={() => { logout(); setOpen(false) }} className="text-left px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-500 font-medium text-sm">Logout</button>
                </>
              ) : (
                <NavLink to="/login" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg hover:bg-primary-50 font-medium text-sm">Login / Register</NavLink>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
