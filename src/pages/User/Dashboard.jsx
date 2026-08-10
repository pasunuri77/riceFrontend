import { Link } from 'react-router-dom'
import { MapPin, RotateCcw, Truck, UserCog, ArrowRight } from 'lucide-react'
import DashboardCard from '../../components/dashboard/DashboardCard'
import PageHeader from '../../components/ui/PageHeader'
import { useAuth } from '../../context/AuthContext'

const QUICK_ACTIONS = [
  { icon: RotateCcw, label: 'Buy Again', to: '/products' },
  { icon: Truck, label: 'Track Orders', to: '/dashboard/orders' },
  { icon: MapPin, label: 'Manage Addresses', to: '/dashboard/addresses' },
  { icon: UserCog, label: 'Update Profile', to: '/dashboard/profile' },
]

export default function Dashboard() {
  const { user, addresses } = useAuth()

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'} 👋`} subtitle="Here's what's happening with your account" />

      <div className="grid grid-cols-1 gap-4 mb-8 max-w-xs">
        <DashboardCard icon={MapPin} label="Saved Addresses" value={addresses?.length || 0} tint="blue" index={0} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {QUICK_ACTIONS.map((qa) => (
          <Link key={qa.label} to={qa.to} className="card p-4 flex items-center gap-3 hover:shadow-cardHover hover:-translate-y-0.5 transition-all">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center"><qa.icon className="w-5 h-5" /></div>
            <span className="text-sm font-semibold">{qa.label}</span>
          </Link>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold font-display">Recent Orders</h3>
          <Link to="/dashboard/orders" className="text-xs font-semibold text-primary-600 flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <p className="text-sm text-ink/40 py-6 text-center">Order activity isn't displayed here.</p>
      </div>
    </div>
  )
}
