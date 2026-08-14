import { LayoutDashboard, Package, Users, ClipboardList, BarChart3, User, Tag, Truck } from 'lucide-react'
import DashboardShell from './DashboardShell'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/admin/coupons', icon: Tag, label: 'Coupons' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/delivery-tax', icon: Truck, label: 'Delivery & Tax' },
  { to: '/admin/profile', icon: User, label: 'Profile' },
]

export default function AdminLayout() {
  return <DashboardShell navItems={navItems} brandLabel="Admin Panel" requireRole="admin" profileTo="/admin/profile" />
}
