import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Clock, CheckCircle2, MapPin, ArrowRight, ShoppingBag } from 'lucide-react'
import DashboardCard from '../../components/dashboard/DashboardCard'
import StatusPill from '../../components/ui/StatusPill'
import PageHeader from '../../components/ui/PageHeader'
import { TextSkeleton } from '../../components/ui/Skeleton'
import { useAuth } from '../../context/AuthContext'
import { formatUSD, formatDate } from '../../utils/format'
import orderApi from '../../api/orderApi'
import useShopNowPath from '../../hooks/useShopNowPath'

export default function Dashboard() {
  const { user, addresses } = useAuth()
  const shopNowPath = useShopNowPath()
  const [ordersData, setOrdersData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Offline (in-store/walk-in) orders are booked by staff on a customer's
    // behalf for record-keeping - they shouldn't show up in the customer's
    // own dashboard (the customer never placed it online, and the online
    // return flow isn't meant to apply to a walk-in sale). Admin's Orders
    // page is the only place these should be visible.
    orderApi.listMine()
      .then((data) => setOrdersData(data.filter((o) => (o.orderType || 'online') !== 'offline')))
      .catch(() => setOrdersData([]))
      .finally(() => setLoading(false))
  }, [])

  const myOrders = ordersData.slice(0, 6)
  const pending = myOrders.filter((o) => ['Pending', 'Processing'].includes(o.deliveryStatus)).length
  const delivered = myOrders.filter((o) => o.deliveryStatus === 'Delivered').length

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        subtitle="Here's what's happening with your account"
        action={<Link to={shopNowPath} className="btn-primary"><ShoppingBag className="w-4 h-4" /> Shop Now</Link>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard icon={Package} label="Total Orders" value={myOrders.length} tint="primary" index={0} loading={loading} />
        <DashboardCard icon={Clock} label="Pending Orders" value={pending} tint="amber" index={1} loading={loading} />
        <DashboardCard icon={CheckCircle2} label="Delivered Orders" value={delivered} tint="leaf" index={2} loading={loading} />
        <DashboardCard icon={MapPin} label="Saved Addresses" value={addresses?.length || 0} tint="blue" index={3} />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold font-display">Recent Orders</h3>
          <Link to="/dashboard/orders" className="text-xs font-semibold text-primary-600 flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 pb-3 border-b border-black/5 last:border-0 last:pb-0">
                <div className="skeleton w-12 h-12 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5"><TextSkeleton className="h-3.5 w-2/3" /><TextSkeleton className="h-3 w-1/3" /></div>
              </div>
            ))
          ) : myOrders.length === 0 ? (
            <p className="text-sm text-ink/40 py-6 text-center">No orders yet.</p>
          ) : myOrders.slice(0, 4).map((o) => (
            <div key={o.id} className="flex items-center gap-3 pb-3 border-b border-black/5 last:border-0 last:pb-0">
              <Link to={o.productId ? `/products/${o.productId}` : '/dashboard/orders'} className="shrink-0">
                <img src={o.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{o.riceName}</p>
                <p className="text-xs text-ink/40">{o.id} • {formatDate(o.date)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatUSD(o.amount)}</p>
                <StatusPill status={o.deliveryStatus} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
