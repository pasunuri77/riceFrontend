import { LayoutDashboard, MapPin, Package, User, ShoppingCart } from 'lucide-react'
import DashboardShell from './DashboardShell'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/orders', icon: Package, label: 'My Orders' },
  { to: '/dashboard/addresses', icon: MapPin, label: 'My Addresses' },
  { to: '/dashboard/cart', icon: ShoppingCart, label: 'Cart' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
]

export default function UserLayout() {
  return <DashboardShell navItems={navItems} brandLabel="User Dashboard" />
}
