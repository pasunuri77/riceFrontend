import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, Clock3, Eye } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import TableShell from '../../components/ui/TableShell'
import DashboardCard from '../../components/dashboard/DashboardCard'
import RowActionsMenu from '../../components/ui/RowActionsMenu'
import EmptyState from '../../components/ui/EmptyState'
import { formatUSD, formatDate } from '../../utils/format'
import orderApi from '../../api/orderApi'
import { RowSkeleton } from '../../components/ui/Skeleton'

// Same "no dedicated Payment entity yet" situation as the admin Payments
// page - every row here is derived 1:1 from the logged-in customer's own
// orders (paymentMethod/paymentStatus/amount), scoped via GET /api/orders
// rather than the admin-only /api/admin/orders.
const METHOD_LABELS = { upi: 'Digital Wallet', card: 'Credit / Debit Card', netbanking: 'Bank Transfer', cod: 'Cash on Delivery' }

export default function Payments() {
  const navigate = useNavigate()
  const [ordersData, setOrdersData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderApi.listMine().then(setOrdersData).catch(() => setOrdersData([])).finally(() => setLoading(false))
  }, [])

  const payments = useMemo(() => [...ordersData]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((o) => ({
      id: `PAY-${o.id.replace(/\D/g, '')}`,
      orderId: o.id,
      amount: o.amount,
      method: o.paymentMethod,
      status: o.paymentStatus,
      date: o.date,
    })), [ordersData])

  const totals = useMemo(() => ({
    paid: payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0),
    pending: payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0),
  }), [payments])

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Payments' }]} />
      <PageHeader title="My Payments" subtitle="Payment history for your orders" />

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <DashboardCard icon={Wallet} label="Total Paid" value={formatUSD(totals.paid)} tint="primary" index={0} loading={loading} />
        <DashboardCard icon={Clock3} label="Pending Amount" value={formatUSD(totals.pending)} tint="amber" index={1} loading={loading} />
      </div>

      {!loading && payments.length === 0 ? (
        <EmptyState icon={Wallet} title="No payments yet" subtitle="Payments for your orders will show up here." actionLabel="Start Shopping" actionTo="/products" />
      ) : (
        <TableShell minWidth="640px">
          <thead>
            <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th scope="col" className="p-3.5 whitespace-nowrap">Payment ID</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">Order ID</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">Amount</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">Method</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">Status</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">Date</th>
              <th scope="col" className="p-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} cols={7} />)
            ) : payments.map((p) => (
              <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-primary-50/40">
                <td className="p-3 font-semibold whitespace-nowrap">{p.id}</td>
                <td className="p-3 text-primary-700 font-semibold whitespace-nowrap">{p.orderId}</td>
                <td className="p-3 font-semibold whitespace-nowrap">{formatUSD(p.amount)}</td>
                <td className="p-3 text-ink/60 whitespace-nowrap">{METHOD_LABELS[p.method] || p.method || '--'}</td>
                <td className="p-3 whitespace-nowrap"><span className={`badge ${p.status === 'Paid' ? 'bg-leaf-100 text-leaf-700' : 'bg-orange-100 text-orange-700'}`}>{p.status}</span></td>
                <td className="p-3 text-ink/50 whitespace-nowrap">{formatDate(p.date)}</td>
                <td className="p-3">
                  <RowActionsMenu
                    id={`my-payment-${p.id}`}
                    label={`Actions for ${p.id}`}
                    items={[{ label: 'View Order', icon: Eye, onClick: () => navigate(`/dashboard/orders/${p.orderId}`) }]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  )
}
