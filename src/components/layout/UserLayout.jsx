import { Navigate } from 'react-router-dom'
import { LayoutDashboard, MapPin, Package, User, ShoppingCart, Wallet } from 'lucide-react'
import DashboardShell from './DashboardShell'
import { useAuth } from '../../context/AuthContext'
import { homePathForRole } from '../../utils/roleHome'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/orders', icon: Package, label: 'My Orders' },
  { to: '/dashboard/payments', icon: Wallet, label: 'Payments' },
  { to: '/dashboard/addresses', icon: MapPin, label: 'My Addresses' },
  { to: '/dashboard/cart', icon: ShoppingCart, label: 'Cart' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
]

export default function UserLayout() {
  const { user } = useAuth()

  // An admin/employee/delivery partner has nothing to do in the customer
  // dashboard - send them to their own dashboard instead of letting them
  // wander into it.
  if (user?.role === 'admin' || user?.role === 'employee' || user?.role === 'delivery_partner') {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return <DashboardShell navItems={navItems} brandLabel="User Dashboard" />
}
