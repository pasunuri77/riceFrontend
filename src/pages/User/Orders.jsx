import { useEffect, useState } from 'react'
import { Package, FileText, Truck, XCircle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatusPill from '../../components/ui/StatusPill'
import EmptyState from '../../components/ui/EmptyState'
import { formatINR, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import orderApi from '../../api/orderApi'

const FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered']

const itemNames = (o) => (o.items?.length ? o.items.map((i) => i.name).join(', ') : o.riceName)
const itemQtys = (o) => (o.items?.length ? o.items.map((i) => `${i.weight}kg x${i.qty}`).join(', ') : o.quantity)

export default function Orders() {
  const [ordersData, setOrdersData] = useState([])
  const [filter, setFilter] = useState('All')
  const { showToast } = useToast()

  useEffect(() => { orderApi.listMine().then(setOrdersData).catch(() => setOrdersData([])) }, [])

  const orders = filter === 'All' ? ordersData : ordersData.filter((o) => o.deliveryStatus === filter)

  return (
    <div>
      <PageHeader title="My Orders" subtitle="Track and manage all your orders" />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${filter === f ? 'bg-primary-500 text-white' : 'bg-white border border-black/10 text-ink/60'}`}>
            {f}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders found" subtitle="You have no orders in this category yet." actionLabel="Start Shopping" actionTo="/products" />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
              <img src={o.image} alt="" className="w-full sm:w-20 h-32 sm:h-20 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <p className="font-bold text-sm">{itemNames(o)}</p>
                  <span className="text-xs text-ink/40">{o.id}</span>
                </div>
                <p className="text-xs text-ink/50 mt-1">{o.address}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-ink/50">
                  <span>Qty: {itemQtys(o)}</span>
                  <span>•</span>
                  <span>Ordered: {formatDate(o.date)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <StatusPill status={o.deliveryStatus} />
                  <span className="text-xs text-ink/40">{o.paymentStatus === 'Paid' ? 'Paid' : 'Payment pending'}</span>
                </div>
              </div>
              <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 sm:text-right sm:min-w-[140px]">
                <p className="font-bold text-lg">{formatINR(o.amount)}</p>
                <div className="flex sm:flex-col gap-2 w-full">
                  <button onClick={() => showToast('Tracking order ' + o.id, 'info')} className="btn text-xs px-3 py-1.5 bg-primary-50 text-primary-700 w-full justify-center"><Truck className="w-3.5 h-3.5" /> Track</button>
                  <button onClick={() => showToast('Invoice downloaded (demo)', 'info')} className="btn text-xs px-3 py-1.5 bg-black/5 text-ink/70 w-full justify-center"><FileText className="w-3.5 h-3.5" /> Invoice</button>
                  {['Pending', 'Processing'].includes(o.deliveryStatus) && (
                    <button onClick={() => showToast('Order cancelled (demo)', 'error')} className="btn text-xs px-3 py-1.5 bg-red-50 text-red-500 w-full justify-center"><XCircle className="w-3.5 h-3.5" /> Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
