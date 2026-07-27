import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatusPill from '../../components/ui/StatusPill'
import Modal from '../../components/ui/Modal'
import { formatINR, formatDate } from '../../utils/format'
import orderApi from '../../api/orderApi'

export default function AdminOrders() {
  const [ordersData, setOrdersData] = useState([])
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState(null)

  useEffect(() => { orderApi.listAll().then(setOrdersData) }, [])

  const list = ordersData.filter((o) => `${o.id} ${o.customerName} ${o.riceName}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <PageHeader title="Order Management" subtitle={`${ordersData.length} total orders`} />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="input-field pl-10" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th className="p-3.5">Order ID</th><th className="p-3.5">Customer</th>
              <th className="p-3.5">Rice</th><th className="p-3.5">Qty</th><th className="p-3.5">Amount</th>
              <th className="p-3.5">Payment</th><th className="p-3.5">Delivery</th><th className="p-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-b border-black/5 last:border-0 hover:bg-primary-50/40">
                <td className="p-3 font-semibold">{o.id}</td>
                <td className="p-3">
                  <Link to={`/admin/customers?id=${o.customerId}`} className="font-semibold text-primary-700 hover:underline">{o.customerName}</Link>
                </td>
                <td className="p-3 max-w-[180px] truncate">{o.riceName}</td>
                <td className="p-3 text-ink/60">{o.quantity}</td>
                <td className="p-3 font-semibold">{formatINR(o.amount)}</td>
                <td className="p-3"><StatusPill status={o.paymentStatus} /></td>
                <td className="p-3"><StatusPill status={o.deliveryStatus} /></td>
                <td className="p-3"><button onClick={() => setViewing(o)} className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-600"><Eye className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.id}>
        {viewing && (
          <div className="space-y-3 text-sm">
            <img src={viewing.image} alt="" className="w-full h-40 object-cover rounded-xl mb-2" />
            <div className="flex justify-between"><span className="text-ink/50">Customer</span><Link to={`/admin/customers?id=${viewing.customerId}`} className="font-semibold text-primary-700 hover:underline">{viewing.customerName}</Link></div>
            <div className="flex justify-between"><span className="text-ink/50">Rice</span><span className="font-semibold text-right">{viewing.riceName}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Address</span><span className="font-semibold text-right max-w-[60%]">{viewing.address}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Quantity</span><span className="font-semibold">{viewing.quantity}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Amount</span><span className="font-semibold">{formatINR(viewing.amount)}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Order Date</span><span className="font-semibold">{formatDate(viewing.date)}</span></div>
            <div className="flex justify-between items-center"><span className="text-ink/50">Payment Status</span><StatusPill status={viewing.paymentStatus} /></div>
            <div className="flex justify-between items-center"><span className="text-ink/50">Delivery Status</span><StatusPill status={viewing.deliveryStatus} /></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
