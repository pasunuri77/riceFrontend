import { LayoutDashboard, MapPin, Package, Heart, User, ShoppingCart, Scale } from 'lucide-react'
import DashboardShell from './DashboardShell'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/orders', icon: Package, label: 'My Orders' },
  { to: '/dashboard/addresses', icon: MapPin, label: 'Addresses' },
  { to: '/dashboard/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/dashboard/compare', icon: Scale, label: 'Compare' },
  { to: '/dashboard/cart', icon: ShoppingCart, label: 'Cart' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
]

export default function UserLayout() {
  return <DashboardShell navItems={navItems} brandLabel="User Dashboard" />
}
