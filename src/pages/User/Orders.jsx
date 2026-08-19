import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, XCircle, Eye, MapPin, CreditCard } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import StatusPill from '../../components/ui/StatusPill'
import EmptyState from '../../components/ui/EmptyState'
import Drawer from '../../components/ui/Drawer'
import { TextSkeleton } from '../../components/ui/Skeleton'
import { formatUSD, formatDate, estimatedDelivery } from '../../utils/format'
import { bagWeightLb } from '../../utils/stock'
import { useToast } from '../../context/ToastContext'
import { useNotifications } from '../../context/NotificationContext'
import { ApiError } from '../../api/client'
import orderApi from '../../api/orderApi'

const FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered']

const itemNames = (o) => (o.items?.length ? o.items.map((i) => i.name).join(', ') : o.riceName)
const itemQtys = (o) => (o.items?.length ? o.items.map((i) => `${bagWeightLb(i.weight)}lb Bag x${i.qty}`).join(', ') : o.quantity)

export default function Orders() {
  const [ordersData, setOrdersData] = useState([])
  const [filter, setFilter] = useState('All')
  const [cancellingId, setCancellingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)
  const { showToast } = useToast()
  const { notify } = useNotifications()

  useEffect(() => {
    orderApi.listMine().then(setOrdersData).catch(() => setOrdersData([])).finally(() => setLoading(false))
  }, [])

  const orders = filter === 'All' ? ordersData : ordersData.filter((o) => o.deliveryStatus === filter)

  const handleCancel = async (orderId) => {
    setCancellingId(orderId)
    try {
      const updatedOrder = await orderApi.cancel(orderId)
      setOrdersData((current) => current.map((order) => order.id === orderId ? updatedOrder : order))
      setViewing((v) => (v?.id === orderId ? updatedOrder : v))
      showToast('Order cancelled', 'success')
      notify('ORDER_CANCELLED', { orderId })
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Order can no longer be cancelled', 'error')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Orders' }]} />
      <PageHeader title="My Orders" subtitle="Track and manage all your orders" />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${filter === f ? 'bg-primary-500 text-white' : 'bg-white border border-black/10 text-ink/60'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
              <div className="skeleton w-full sm:w-20 h-32 sm:h-20 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <TextSkeleton className="h-4 w-2/3" />
                <TextSkeleton className="h-3 w-1/2" />
                <TextSkeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders found" subtitle="You have no orders in this category yet." actionLabel="Start Shopping" actionTo="/products" />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
              {o.productId ? (
                <Link to={`/products/${o.productId}`} className="shrink-0">
                  <img src={o.image} alt="" className="w-full sm:w-20 h-32 sm:h-20 rounded-lg object-cover" />
                </Link>
              ) : (
                <img src={o.image} alt="" className="w-full sm:w-20 h-32 sm:h-20 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <p className="font-bold text-sm">{itemNames(o)}</p>
                  <span className="text-xs text-primary-600 font-semibold">{o.id}</span>
                </div>
                <p className="text-xs text-ink/50 mt-1">{o.address}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-ink/50">
                  <span>Qty: {itemQtys(o)}</span>
                  <span>•</span>
                  <span>Ordered: {formatDate(o.date)}</span>
                  {o.deliveryStatus === 'Delivered' && o.deliveredAt ? (
                    <>
                      <span>•</span>
                      <span>Delivered On: <span className="font-semibold text-ink/70">{formatDate(o.deliveredAt)}</span></span>
                    </>
                  ) : o.deliveryStatus !== 'Cancelled' && (
                    <>
                      <span>•</span>
                      <span>Estimated Delivery: <span className="font-semibold text-ink/70">{estimatedDelivery(4, o.date)}</span></span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <StatusPill status={o.deliveryStatus} />
                  <span className="text-xs text-ink/40">{o.paymentStatus === 'Paid' ? 'Paid' : 'Payment pending'}</span>
                </div>
              </div>
              <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 sm:text-right sm:min-w-[140px]">
                <p className="font-bold text-lg">{formatUSD(o.amount)}</p>
                <div className="flex sm:flex-col gap-2 w-full">
                  <button onClick={() => setViewing(o)} className="btn text-xs px-3 py-1.5 bg-primary-50 text-primary-700 w-full justify-center"><Eye className="w-3.5 h-3.5" /> View Details</button>
                  {['Pending', 'Processing'].includes(o.deliveryStatus) && (
                    <button onClick={() => handleCancel(o.id)} disabled={cancellingId === o.id} className="btn text-xs px-3 py-1.5 bg-red-50 text-red-500 w-full justify-center disabled:opacity-60">
                      <XCircle className="w-3.5 h-3.5" /> {cancellingId === o.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order details - slide-in from the right, using the order already in
          hand from the list above (no extra fetch), matching the same pattern
          used on the admin Orders page. */}
      <Drawer open={!!viewing} onClose={() => setViewing(null)} title="Order Details" width="max-w-lg">
        {viewing && (
          <div className="p-5 space-y-5 text-sm">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-lg font-display">{viewing.id}</h4>
                <StatusPill status={viewing.deliveryStatus} />
              </div>
              <p className="text-ink/50 text-xs mt-1">
                {formatDate(viewing.date)}
                {viewing.deliveryStatus === 'Delivered' && viewing.deliveredAt
                  ? ` • Delivered ${formatDate(viewing.deliveredAt)}`
                  : viewing.deliveryStatus !== 'Cancelled' ? ` • Estimated Delivery ${estimatedDelivery(4, viewing.date)}` : ''}
              </p>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Order Items</h5>
              <div className="card divide-y divide-black/5">
                {(viewing.items?.length ? viewing.items : [{ name: itemNames(viewing), weight: '', qty: viewing.quantity, pricePerKg: 0 }]).map((i, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{i.name}</p>
                      <p className="text-xs text-ink/40">{i.weight ? `${bagWeightLb(i.weight)}lb Bag` : ''} {i.weight ? '•' : ''} Qty: {i.qty}</p>
                    </div>
                    <p className="font-bold shrink-0">{formatUSD((i.pricePerKg || 0) * (i.weight || 0) * (i.qty || 1))}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Delivery Address</h5>
              <p className="card p-3.5 text-ink/70">{viewing.address || '--'}</p>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2">Price Breakdown</h5>
              <div className="card p-3.5 space-y-2">
                <div className="flex justify-between"><span className="text-ink/50">Subtotal</span><span className="font-semibold">{formatUSD(viewing.subtotal)}</span></div>
                {viewing.offerDiscount > 0 && (
                  <div className="flex justify-between text-leaf-600"><span>Offer Discount</span><span className="font-semibold">-{formatUSD(viewing.offerDiscount)}</span></div>
                )}
                {viewing.discountAmount > 0 && (
                  <div className="flex justify-between text-leaf-600"><span>Coupon Discount {viewing.couponCode && `(${viewing.couponCode})`}</span><span className="font-semibold">-{formatUSD(viewing.discountAmount)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-ink/50">Delivery</span><span className="font-semibold">{viewing.deliveryCharge > 0 ? formatUSD(viewing.deliveryCharge) : 'Free'}</span></div>
                <div className="flex justify-between"><span className="text-ink/50">Tax</span><span className="font-semibold">{formatUSD(viewing.tax)}</span></div>
                <div className="border-t border-black/10 pt-2 flex justify-between items-center">
                  <span className="font-bold">Total Paid</span>
                  <span className="font-extrabold text-lg text-primary-700">{formatUSD(viewing.amount)}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Payment</h5>
              <div className="card p-3.5 flex justify-between items-center">
                <span className="text-ink/50">Status</span>
                <StatusPill status={viewing.paymentStatus} />
              </div>
            </div>

            {['Pending', 'Processing'].includes(viewing.deliveryStatus) && (
              <button onClick={() => handleCancel(viewing.id)} disabled={cancellingId === viewing.id} className="btn w-full bg-red-50 text-red-500 disabled:opacity-60">
                <XCircle className="w-4 h-4" /> {cancellingId === viewing.id ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
