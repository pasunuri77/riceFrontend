import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { STATUS_STYLES } from '../../components/ui/StatusPill'
import Modal from '../../components/ui/Modal'
import { formatINR, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import orderApi from '../../api/orderApi'
import { useToast } from '../../context/ToastContext'

const itemsSummary = (o) => (o.items?.length ? o.items.map((i) => `${i.name} (${i.weight}kg x${i.qty})`).join(', ') : o.riceName)

const PAYMENT_STATUSES = ['Pending', 'Paid']
const DELIVERY_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

function StatusSelect({ value, options, onChange, disabled = false }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
      className={`badge border-0 cursor-pointer pr-6 disabled:opacity-60 disabled:cursor-not-allowed ${STATUS_STYLES[value] || 'bg-black/10 text-ink/60'}`}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export default function AdminOrders() {
  const { showToast } = useToast()
  const [ordersData, setOrdersData] = useState([])
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState(null)
  const [updating, setUpdating] = useState({})

  useEffect(() => { orderApi.listAll().then(setOrdersData).catch(() => setOrdersData([])) }, [])

  const list = ordersData.filter((o) => `${o.id} ${o.customerName} ${o.riceName}`.toLowerCase().includes(search.toLowerCase()))

  const updatePaymentStatus = (id, status) => {
    orderApi.updatePaymentStatus(id, status).then((updated) => {
      setOrdersData((prev) => prev.map((o) => (o.id === id ? updated : o)))
      setViewing((v) => (v?.id === id ? updated : v))
    }).catch((err) => showToast(err instanceof ApiError ? err.message : 'Failed to update payment status', 'error'))
  }

  const updateDeliveryStatus = (id, status) => {
    orderApi.updateDeliveryStatus(id, status).then((updated) => {
      setOrdersData((prev) => prev.map((o) => (o.id === id ? updated : o)))
      setViewing((v) => (v?.id === id ? updated : v))
    }).catch((err) => showToast(err instanceof ApiError ? err.message : 'Failed to update delivery status', 'error'))
  }
  const replaceOrder = (updatedOrder) => {
    setOrdersData((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)))
    setViewing((v) => (v?.id === updatedOrder.id ? updatedOrder : v))
  }

  const updatePaymentStatus = async (id, status) => {
    const key = `${id}:payment`
    setUpdating((prev) => ({ ...prev, [key]: true }))
    try {
      const updatedOrder = await orderApi.updatePaymentStatus(id, status)
      replaceOrder(updatedOrder)
      showToast('Payment status updated', 'success')
    } catch (err) {
      showToast(err.message || 'Unable to update payment status', 'error')
    } finally {
      setUpdating((prev) => ({ ...prev, [key]: false }))
    }
  }

  const updateDeliveryStatus = async (id, status) => {
    const key = `${id}:delivery`
    setUpdating((prev) => ({ ...prev, [key]: true }))
    try {
      const updatedOrder = await orderApi.updateDeliveryStatus(id, status)
      replaceOrder(updatedOrder)
      showToast('Delivery status updated', 'success')
    } catch (err) {
      showToast(err.message || 'Unable to update delivery status', 'error')
    } finally {
      setUpdating((prev) => ({ ...prev, [key]: false }))
    }

  }

  return (
    <div>
      <PageHeader title="Order Management" subtitle={`${ordersData.length} total orders`} />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="input-field pl-10" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead>
            <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th className="p-3.5">Order ID</th><th className="p-3.5">Customer</th>
              <th className="p-3.5">Rice</th><th className="p-3.5">Qty</th><th className="p-3.5">Amount</th>
              <th className="p-3.5">Date</th>
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
                <td className="p-3 max-w-[220px] break-words">{itemsSummary(o)}</td>
                <td className="p-3 text-ink/60">{o.quantity}</td>
                <td className="p-3 font-semibold">{formatINR(o.amount)}</td>
                <td className="p-3 text-ink/50">{formatDate(o.date)}</td>
                <td className="p-3"><StatusSelect value={o.paymentStatus} options={PAYMENT_STATUSES} disabled={updating[`${o.id}:payment`]} onChange={(status) => updatePaymentStatus(o.id, status)} /></td>
                <td className="p-3"><StatusSelect value={o.deliveryStatus} options={DELIVERY_STATUSES} disabled={updating[`${o.id}:delivery`]} onChange={(status) => updateDeliveryStatus(o.id, status)} /></td>
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
            <div className="flex justify-between"><span className="text-ink/50">Rice</span><span className="font-semibold text-right max-w-[60%]">{itemsSummary(viewing)}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Address</span><span className="font-semibold text-right max-w-[60%]">{viewing.address}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Amount</span><span className="font-semibold">{formatINR(viewing.amount)}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Order Date</span><span className="font-semibold">{formatDate(viewing.date)}</span></div>
            <div className="flex justify-between items-center"><span className="text-ink/50">Payment Status</span><StatusSelect value={viewing.paymentStatus} options={PAYMENT_STATUSES} disabled={updating[`${viewing.id}:payment`]} onChange={(status) => updatePaymentStatus(viewing.id, status)} /></div>
            <div className="flex justify-between items-center"><span className="text-ink/50">Delivery Status</span><StatusSelect value={viewing.deliveryStatus} options={DELIVERY_STATUSES} disabled={updating[`${viewing.id}:delivery`]} onChange={(status) => updateDeliveryStatus(viewing.id, status)} /></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
