import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import ChartCard from '../../components/dashboard/ChartCard'
import { formatINR } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import orderApi from '../../api/orderApi'
import productApi from '../../api/productApi'
import brandApi from '../../api/brandApi'

const COLORS = ['#e8912a', '#479437', '#c96f1e', '#357628', '#a1541a', '#8fca80']

export default function AdminReports() {
  const { showToast } = useToast()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])

  useEffect(() => {
    orderApi.listAll().then(setOrders).catch(() => setOrders([]))
    productApi.list().then(setProducts).catch(() => setProducts([]))
    brandApi.list().then(setBrands).catch(() => setBrands([]))
  }, [])

  // Only count revenue once payment is confirmed AND the order has shipped -
  // a paid-but-unshipped order can still be cancelled/refunded.
  const paidShippedOrders = orders.filter((o) => o.paymentStatus === 'Paid' && ['Shipped', 'Delivered'].includes(o.deliveryStatus))
  const totalRevenue = paidShippedOrders.reduce((s, o) => s + o.amount, 0)
  const avgOrderValue = paidShippedOrders.length ? Math.round(totalRevenue / paidShippedOrders.length) : 0

  const orderStatusSplit = useMemo(() => {
    const counts = {}
    orders.forEach((o) => { counts[o.deliveryStatus] = (counts[o.deliveryStatus] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [orders])

  const topRiceByOrders = useMemo(() => {
    const counts = {}
    orders.forEach((o) => { if (o.riceName) counts[o.riceName] = (counts[o.riceName] || 0) + 1 })
    return Object.entries(counts)
      .map(([name, orders]) => ({ name, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)
  }, [orders])

  const productsByBrand = useMemo(() => {
    const counts = {}
    products.forEach((p) => { if (p.brand) counts[p.brand] = (counts[p.brand] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [products])

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Revenue, sales and customer insights"
        action={<button onClick={() => showToast('Report exported (demo)', 'info')} className="btn-outline text-sm"><Download className="w-4 h-4" /> Export</button>}
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5"><p className="text-xs text-ink/50">Total Revenue</p><p className="text-2xl font-extrabold font-display mt-1">{formatINR(totalRevenue)}</p></div>
        <div className="card p-5"><p className="text-xs text-ink/50">Total Orders</p><p className="text-2xl font-extrabold font-display mt-1">{orders.length}</p></div>
        <div className="card p-5"><p className="text-xs text-ink/50">Avg. Order Value</p><p className="text-2xl font-extrabold font-display mt-1">{formatINR(avgOrderValue)}</p></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <ChartCard title="Order Status" sub="Current distribution across all orders">
          {orderStatusSplit.length === 0 ? (
            <p className="text-sm text-ink/40 py-10 text-center">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={orderStatusSplit} dataKey="value" nameKey="name" outerRadius={85} label>
                  {orderStatusSplit.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top Rice" sub="By number of orders">
          {topRiceByOrders.length === 0 ? (
            <p className="text-sm text-ink/40 py-10 text-center">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topRiceByOrders} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="orders" fill="#357628" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Products by Brand" sub="Catalogue breakdown">
        {productsByBrand.length === 0 ? (
          <p className="text-sm text-ink/40 py-10 text-center">No products yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={productsByBrand} dataKey="value" nameKey="name" outerRadius={90} label>
                {productsByBrand.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}
