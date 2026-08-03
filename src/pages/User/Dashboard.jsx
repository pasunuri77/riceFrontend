import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Clock, CheckCircle2, MapPin, Heart, RotateCcw, Truck, UserCog, ArrowRight } from 'lucide-react'
import DashboardCard from '../../components/dashboard/DashboardCard'
import ProductCard from '../../components/product/ProductCard'
import StatusPill from '../../components/ui/StatusPill'
import PageHeader from '../../components/ui/PageHeader'
import { TextSkeleton, ProductCardSkeleton } from '../../components/ui/Skeleton'
import { useAuth } from '../../context/AuthContext'
import { useWishlist } from '../../context/WishlistContext'
import { useCart } from '../../context/CartContext'
import { formatINR, formatDate } from '../../utils/format'
import orderApi from '../../api/orderApi'
import productApi from '../../api/productApi'

const QUICK_ACTIONS = [
  { icon: RotateCcw, label: 'Buy Again', to: '/products' },
  { icon: Truck, label: 'Track Orders', to: '/dashboard/orders' },
  { icon: MapPin, label: 'Manage Addresses', to: '/dashboard/addresses' },
  { icon: UserCog, label: 'Update Profile', to: '/dashboard/profile' },
]

export default function Dashboard() {
  const { user, addresses } = useAuth()
  const { wishlist } = useWishlist()
  const { addToCart } = useCart()
  const [ordersData, setOrdersData] = useState([])
  const [productsData, setProductsData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      orderApi.listMine().then(setOrdersData).catch(() => setOrdersData([])),
      productApi.list().then(setProductsData).catch(() => setProductsData([])),
    ]).finally(() => setLoading(false))
  }, [])

  const myOrders = ordersData.slice(0, 6)
  const pending = myOrders.filter((o) => ['Pending', 'Processing'].includes(o.deliveryStatus)).length
  const delivered = myOrders.filter((o) => o.deliveryStatus === 'Delivered').length
  const recommended = productsData.slice(4, 8)

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'} 👋`} subtitle="Here's what's happening with your account" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <DashboardCard icon={Package} label="Total Orders" value={myOrders.length} tint="primary" index={0} loading={loading} />
        <DashboardCard icon={Clock} label="Pending Orders" value={pending} tint="amber" index={1} loading={loading} />
        <DashboardCard icon={CheckCircle2} label="Delivered Orders" value={delivered} tint="leaf" index={2} loading={loading} />
        <DashboardCard icon={MapPin} label="Saved Addresses" value={addresses?.length || 0} tint="blue" index={3} />
        <DashboardCard icon={Heart} label="Wishlist Items" value={wishlist.length} tint="red" index={4} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {QUICK_ACTIONS.map((qa) => (
          <Link key={qa.label} to={qa.to} className="card p-4 flex items-center gap-3 hover:shadow-cardHover hover:-translate-y-0.5 transition-all">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center"><qa.icon className="w-5 h-5" /></div>
            <span className="text-sm font-semibold">{qa.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card p-5">
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
                <img src={o.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{o.riceName}</p>
                  <p className="text-xs text-ink/40">{o.id} • {formatDate(o.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatINR(o.amount)}</p>
                  <StatusPill status={o.deliveryStatus} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold font-display mb-4">Recently Ordered Rice</h3>
          <div className="space-y-3">
            {!loading && myOrders.length === 0 && <p className="text-sm text-ink/40 py-6 text-center">No orders yet.</p>}
            {myOrders.slice(0, 4).map((o) => (
              <div key={o.id} className="flex items-center gap-3">
                <img src={o.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <p className="text-xs font-medium flex-1 line-clamp-2">{o.riceName}</p>
                <button
                  onClick={() => addToCart(productsData.find((p) => p.id === o.productId) || productsData[0])}
                  className="text-[11px] font-bold text-primary-600 shrink-0"
                >
                  Buy Again
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold font-display mb-4">Recommended for You</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : recommended.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </div>
    </div>
  )
}
