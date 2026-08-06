import { LayoutDashboard, Package, Users, ClipboardList, BarChart3, Settings, Tag, Image } from 'lucide-react'
import DashboardShell from './DashboardShell'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/admin/coupons', icon: Tag, label: 'Coupons' },
  { to: '/admin/banners', icon: Image, label: 'Banners' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminLayout() {
  return <DashboardShell navItems={navItems} brandLabel="Admin Panel" requireRole="admin" profileTo="/admin/settings" />
}
