import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, Users, ClipboardList, BarChart3, User, Tag, Truck } from 'lucide-react'
import DashboardShell from './DashboardShell'
import { useAuth } from '../../context/AuthContext'
import staffApi from '../../api/staffApi'

// Every entry except the two `always` ones is gated by an Employee permission
// key (see src/data/permissions.js) - an `admin` role always sees everything,
// an `employee` only sees what they've been granted.
const ALL_NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true, always: true },
  { to: '/admin/products', icon: Package, label: 'Products', perm: 'canManageProducts' },
  // Also covers the merged staff (Employee/Admin) list on this same page -
  // there's no separate permission for managing staff, since an employee is
  // never allowed to touch other admins/employees regardless of grants.
  { to: '/admin/customers', icon: Users, label: 'Customers', perm: 'canManageCustomers' },
  { to: '/admin/orders', icon: ClipboardList, label: 'Orders', perm: 'canManageOrders' },
  { to: '/admin/coupons', icon: Tag, label: 'Coupons', perm: 'canManageCoupons' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports', perm: 'canViewReports' },
  { to: '/admin/delivery-tax', icon: Truck, label: 'Delivery & Tax', perm: 'canManageDeliveryTax' },
  { to: '/admin/profile', icon: User, label: 'Profile', always: true },
]

export default function AdminLayout() {
  const { user } = useAuth()
  const isEmployee = user?.role === 'employee'
  const [permissions, setPermissions] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  const fetchPerms = () => {
    if (!isEmployee) return
    staffApi.myPermissions().then(setPermissions).catch(() => setPermissions({}))
  }

  useEffect(() => { fetchPerms() }, [user?.id, isEmployee])

  // Polled rather than fetched once so a permission an admin just revoked is
  // reflected in this employee's own sidebar within seconds, without requiring
  // them to log out and back in.
  useEffect(() => {
    if (!isEmployee) return
    const interval = setInterval(fetchPerms, 15000)
    return () => clearInterval(interval)
  }, [user?.id, isEmployee])

  const canSee = (item) => {
    if (item.always) return true
    if (user?.role === 'admin') return true
    if (!isEmployee || !permissions) return false
    return !!permissions[item.perm]
  }

  const visibleNav = ALL_NAV.filter(canSee)

  // If an employee is currently on a page whose permission was just revoked
  // (caught by the poll above), bounce them back to the Dashboard rather than
  // leaving them stranded on a now-forbidden page.
  useEffect(() => {
    if (!isEmployee || !permissions) return
    const current = ALL_NAV.find((item) => !item.always && location.pathname.startsWith(item.to))
    if (current && !permissions[current.perm]) navigate('/admin', { replace: true })
  }, [permissions, location.pathname, isEmployee])

  return <DashboardShell navItems={visibleNav} brandLabel="Admin Panel" requireRole={['admin', 'employee']} profileTo="/admin/profile" />
}
