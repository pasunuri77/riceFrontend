import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, Users, ClipboardList, Clock, CheckCircle2, PieChart as PieChartIcon, BarChart3, ArrowRight, Receipt } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import DashboardCard from '../../components/dashboard/DashboardCard'
import ChartCard from '../../components/dashboard/ChartCard'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import StatusPill from '../../components/ui/StatusPill'
import { TextSkeleton } from '../../components/ui/Skeleton'
import { formatUSD, formatDate } from '../../utils/format'
import productApi from '../../api/productApi'
import orderApi from '../../api/orderApi'
import customerApi from '../../api/customerApi'

const COLORS = ['#e8912a', '#479437', '#c96f1e', '#357628', '#a1541a', '#8fca80']

const itemsSummary = (o) => (o.items?.length ? o.items.map((i) => i.name).join(', ') : o.riceName)

function groupCount(list, key) {
  const counts = {}
  list.forEach((item) => { counts[item[key]] = (counts[item[key]] || 0) + 1 })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: '0 8px 24px rgba(101,53,23,0.12)',
  fontSize: 12,
  padding: '8px 12px',
}

export default function AdminDashboard() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      productApi.list().then(setProducts).catch(() => setProducts([])),
      orderApi.listAll().then(setOrders).catch(() => setOrders([])),
      customerApi.list().then(setCustomers).catch(() => setCustomers([])),
    ]).finally(() => setLoading(false))
  }, [])

  // Only count revenue once payment is confirmed AND the order has shipped -
  // a paid-but-unshipped order can still be cancelled/refunded.
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'Paid' && ['Shipped', 'Delivered'].includes(o.deliveryStatus))
    .reduce((s, o) => s + o.amount, 0)
  const pendingOrders = orders.filter((o) => ['Pending', 'Processing'].includes(o.deliveryStatus)).length
  const deliveredOrders = orders.filter((o) => o.deliveryStatus === 'Delivered').length
  const recentOrders = orders.slice(0, 5)

  const orderStatusSplit = useMemo(() => groupCount(orders, 'deliveryStatus'), [orders])
  const productsByCategory = useMemo(() => groupCount(products, 'category'), [products])

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Dashboard' }]} />
      <PageHeader title="Admin Dashboard" subtitle="Overview of your store's performance" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <DashboardCard icon={DollarSign} label="Total Revenue" value={formatUSD(totalRevenue)} tint="primary" index={0} loading={loading} />
        <DashboardCard icon={Users} label="Total Customers" value={customers.length} tint="blue" index={1} loading={loading} />
        <DashboardCard icon={ClipboardList} label="Total Orders" value={orders.length} tint="primary" index={2} loading={loading} />
        <DashboardCard icon={Clock} label="Pending Orders" value={pendingOrders} tint="amber" index={3} loading={loading} />
        <DashboardCard icon={CheckCircle2} label="Delivered Orders" value={deliveredOrders} tint="leaf" index={4} loading={loading} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <ChartCard title="Order Status" sub="Current distribution across all orders" icon={PieChartIcon}>
          {loading ? (
            <div className="skeleton h-[280px] rounded-xl" />
          ) : orderStatusSplit.length === 0 ? (
            <p className="text-sm text-ink/40 py-16 text-center">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={orderStatusSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} cornerRadius={4}>
                  {orderStatusSplit.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Products by Category" sub="Catalogue breakdown" icon={BarChart3}>
          {loading ? (
            <div className="skeleton h-[280px] rounded-xl" />
          ) : productsByCategory.length === 0 ? (
            <p className="text-sm text-ink/40 py-16 text-center">No products yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={productsByCategory} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#2a211888' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#2a2118' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(232,145,42,0.06)' }} />
                <Bar dataKey="value" fill="#e8912a" radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Recent Orders" sub="Latest activity across the store" icon={Receipt}
        className="mb-6"
      >
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="flex-1 space-y-1.5"><TextSkeleton className="h-3.5 w-1/2" /><TextSkeleton className="h-3 w-1/3" /></div>
                <TextSkeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-sm text-ink/40 py-10 text-center">No orders yet.</p>
        ) : (
          <>
            <div className="divide-y divide-black/5">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {o.productId ? (
                    <Link to={`/products/${o.productId}`} className="shrink-0">
                      <img src={o.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-primary-50" />
                    </Link>
                  ) : (
                    <img src={o.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-primary-50" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{itemsSummary(o)}</p>
                    <p className="text-xs text-ink/40">{o.id} • {o.customerName} • {formatDate(o.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{formatUSD(o.amount)}</p>
                    <StatusPill status={o.deliveryStatus} />
                  </div>
                </div>
              ))}
            </div>
            <Link to="/admin/orders" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 mt-4 pt-4 border-t border-black/5">
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </>
        )}
      </ChartCard>
    </div>
  )
}
