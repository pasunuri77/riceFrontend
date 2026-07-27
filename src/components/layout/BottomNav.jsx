import { NavLink } from 'react-router-dom'
import { Home, Grid3x3, ShoppingCart, Heart, User } from 'lucide-react'
import { useCart } from '../../context/CartContext'

const ITEMS = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/products', icon: Grid3x3, label: 'Shop' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/dashboard', icon: User, label: 'Account' },
]

export default function BottomNav() {
  const { count } = useCart()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-black/10 flex lg:hidden">
      {ITEMS.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium relative ${isActive ? 'text-primary-600' : 'text-ink/50'}`
          }
        >
          <div className="relative">
            <it.icon className="w-5 h-5" />
            {it.to === '/cart' && count > 0 && (
              <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-primary-500 text-white text-[8px] rounded-full flex items-center justify-center">{count}</span>
            )}
          </div>
          {it.label}
        </NavLink>
      ))}
    </nav>
  )
}
