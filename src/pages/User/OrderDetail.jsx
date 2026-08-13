import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, XCircle, MapPin, CreditCard, CalendarClock } from 'lucide-react'
import Breadcrumb from '../../components/ui/Breadcrumb'
import PageHeader from '../../components/ui/PageHeader'
import StatusPill from '../../components/ui/StatusPill'
import EmptyState from '../../components/ui/EmptyState'
import OrderTimeline from '../../components/ui/OrderTimeline'
import { TextSkeleton } from '../../components/ui/Skeleton'
import { formatINR, formatDate, estimatedDelivery } from '../../utils/format'
import { safeImageUrl } from '../../utils/sanitize'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useNotifications } from '../../context/NotificationContext'
import { ApiError } from '../../api/client'
import orderApi from '../../api/orderApi'

const itemNames = (o) => (o.items?.length ? o.items.map((i) => i.name).join(', ') : o.riceName)

export default function OrderDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { notify } = useNotifications()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    orderApi.getById(id)
      .then((data) => {
        // Defense in depth: GET /api/orders/:id has no ownership check on the backend
        // today (unlike cancel(), which does), so a signed-in customer could otherwise
        // fetch any other customer's order by guessing an id. Treat a mismatch as
        // "not found" here rather than rendering someone else's address/items/total.
        if (data?.customerId && String(data.customerId) !== String(user?.id)) {
          setNotFound(true)
          setOrder(null)
        } else {
          setOrder(data)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id, user?.id])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const updated = await orderApi.cancel(order.id)
      setOrder(updated)
      showToast('Order cancelled', 'success')
      notify('ORDER_CANCELLED', { orderId: order.id })
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Order can no longer be cancelled', 'error')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Orders', to: '/dashboard/orders' }, { label: id }]} />
        <TextSkeleton className="h-8 w-64 mb-6" />
        <div className="card p-5 space-y-3">
          <TextSkeleton className="h-4 w-1/2" />
          <TextSkeleton className="h-4 w-1/3" />
          <TextSkeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div>
        <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Orders', to: '/dashboard/orders' }, { label: id }]} />
        <EmptyState icon={Package} title="Order not found" subtitle="This order doesn't exist or doesn't belong to your account." actionLabel="Back to My Orders" actionTo="/dashboard/orders" />
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Orders', to: '/dashboard/orders' }, { label: order.id }]} />
      <PageHeader
        title={`Order ${order.id}`}
        subtitle={`Placed on ${formatDate(order.date)}`}
        action={<StatusPill status={order.deliveryStatus} />}
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          {/* Product Details */}
          <div className="card p-5">
            <h3 className="font-bold mb-3">Product Details</h3>
            <div className="space-y-3">
              {(order.items?.length ? order.items : [{ name: itemNames(order), weight: '', qty: '' }]).map((item, i) => (
                <div key={i} className="flex items-center gap-3 pb-3 border-b border-black/5 last:border-0 last:pb-0">
                  {i === 0 && (
                    order.productId ? (
                      <Link to={`/products/${order.productId}`} className="shrink-0">
                        <img src={safeImageUrl(order.image)} alt="" className="w-14 h-14 rounded-lg object-cover bg-primary-50" />
                      </Link>
                    ) : (
                      <img src={safeImageUrl(order.image)} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0 bg-primary-50" />
                    )
                  )}
                  <div className={`flex-1 min-w-0 ${i > 0 ? 'ml-[68px]' : ''}`}>
                    {i === 0 && order.productId ? (
                      <Link to={`/products/${order.productId}`} className="text-sm font-semibold truncate block hover:text-primary-600">{item.name}</Link>
                    ) : (
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                    )}
                    {item.weight && <p className="text-xs text-ink/40">{item.weight}kg Bag • Qty: {item.qty} bag{item.qty === 1 ? '' : 's'}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Information */}
          <div className="card p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-primary-600" aria-hidden="true" /> Delivery Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink/50">Ordered On</span><span className="font-semibold">{formatDate(order.date)}</span></div>
              {order.deliveryStatus !== 'Cancelled' && (
                <div className="flex justify-between"><span className="text-ink/50">Estimated Delivery</span><span className="font-semibold">{estimatedDelivery(4, order.date)}</span></div>
              )}
              <div className="flex justify-between items-center"><span className="text-ink/50">Status</span><StatusPill status={order.deliveryStatus} /></div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="card p-5">
            <h3 className="font-bold mb-4">Order Timeline</h3>
            <OrderTimeline status={order.deliveryStatus} />
          </div>

          {/* Shipping Address */}
          <div className="card p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-600" aria-hidden="true" /> Shipping Address</h3>
            <p className="text-sm text-ink/60">{order.address}</p>
          </div>

          <div className="card p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary-600" aria-hidden="true" /> Payment</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/50">Status</span>
              <StatusPill status={order.paymentStatus} />
            </div>
          </div>
        </div>

        {/* Price Breakdown - real per-order snapshot fields (subtotal/tax/
            deliveryCharge/discountAmount/offerDiscount), not just the final
            blended amount. */}
        <div className="card p-5 h-fit sticky top-20">
          <h3 className="font-bold mb-4">Price Breakdown</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-ink/50">Subtotal</span><span className="font-medium">{formatINR(order.subtotal)}</span></div>
            {order.offerDiscount > 0 && (
              <div className="flex justify-between text-leaf-600"><span>Offer Discount</span><span className="font-medium">-{formatINR(order.offerDiscount)}</span></div>
            )}
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-leaf-600"><span>Coupon Discount {order.couponCode && `(${order.couponCode})`}</span><span className="font-medium">-{formatINR(order.discountAmount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-ink/50">Delivery</span><span className="font-medium">{order.deliveryCharge > 0 ? formatINR(order.deliveryCharge) : 'Free'}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Tax</span><span className="font-medium">{formatINR(order.tax)}</span></div>
          </div>
          <div className="border-t border-black/10 my-3" />
          <div className="flex justify-between items-center">
            <span className="font-bold">Total Paid</span>
            <span className="font-extrabold text-xl text-primary-700">{formatINR(order.amount)}</span>
          </div>
          <div className="flex flex-col gap-2 mt-5">
            {['Pending', 'Processing'].includes(order.deliveryStatus) && (
              <button onClick={handleCancel} disabled={cancelling} className="btn text-xs px-3 py-2 bg-red-50 text-red-500 w-full justify-center disabled:opacity-60">
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
          <Link to="/dashboard/orders" className="text-xs font-semibold text-primary-600 mt-4 inline-block">← Back to My Orders</Link>
        </div>
      </div>
    </div>
  )
}
