import { useEffect, useMemo, useState } from 'react'
import { IndianRupee, Users, ClipboardList, Clock, CheckCircle2, Package } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import DashboardCard from '../../components/dashboard/DashboardCard'
import ChartCard from '../../components/dashboard/ChartCard'
import PageHeader from '../../components/ui/PageHeader'
import { formatINR } from '../../utils/format'
import productApi from '../../api/productApi'
import orderApi from '../../api/orderApi'
import customerApi from '../../api/customerApi'

const COLORS = ['#e8912a', '#479437', '#c96f1e', '#357628', '#a1541a', '#8fca80']

function groupCount(list, key) {
  const counts = {}
  list.forEach((item) => { counts[item[key]] = (counts[item[key]] || 0) + 1 })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

export default function AdminDashboard() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    productApi.list().then(setProducts).catch(() => setProducts([]))
    orderApi.listAll().then(setOrders).catch(() => setOrders([]))
    customerApi.list().then(setCustomers).catch(() => setCustomers([]))
  }, [])

  // Only count revenue once payment is confirmed AND the order has shipped -
  // a paid-but-unshipped order can still be cancelled/refunded.
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'Paid' && ['Shipped', 'Delivered'].includes(o.deliveryStatus))
    .reduce((s, o) => s + o.amount, 0)
  const pendingOrders = orders.filter((o) => ['Pending', 'Processing'].includes(o.deliveryStatus)).length
  const deliveredOrders = orders.filter((o) => o.deliveryStatus === 'Delivered').length
  const lowStock = products.filter((p) => p.stock < 100).length

  const orderStatusSplit = useMemo(() => groupCount(orders, 'deliveryStatus'), [orders])
  const productsByCategory = useMemo(() => groupCount(products, 'category'), [products])

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Overview of your store's performance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashboardCard icon={IndianRupee} label="Total Revenue" value={formatINR(totalRevenue)} tint="primary" index={0} />
        <DashboardCard icon={Users} label="Total Customers" value={customers.length} tint="blue" index={1} />
        <DashboardCard icon={ClipboardList} label="Total Orders" value={orders.length} tint="primary" index={2} />
        <DashboardCard icon={Clock} label="Pending Orders" value={pendingOrders} tint="amber" index={3} />
        <DashboardCard icon={CheckCircle2} label="Delivered Orders" value={deliveredOrders} tint="leaf" index={4} />
        <DashboardCard icon={Package} label="Total Products" value={products.length} sub={`${lowStock} low stock`} tint="red" index={5} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <ChartCard title="Order Status" sub="Current distribution across all orders">
          {orderStatusSplit.length === 0 ? (
            <p className="text-sm text-ink/40 py-10 text-center">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={orderStatusSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {orderStatusSplit.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Products by Category" sub="Catalogue breakdown">
          {productsByCategory.length === 0 ? (
            <p className="text-sm text-ink/40 py-10 text-center">No products yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={productsByCategory} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#e8912a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
