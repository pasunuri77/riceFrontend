import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, XCircle, Eye, MapPin, CreditCard, RotateCcw, Download } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import StatusPill from '../../components/ui/StatusPill'
import CancellationInfo from '../../components/ui/CancellationInfo'
import RefundInfo from '../../components/ui/RefundInfo'
import CancelOrderModal from '../../components/ui/CancelOrderModal'
import ReturnRequestModal from '../../components/ui/ReturnRequestModal'
import ReturnStatusModal from '../../components/ui/ReturnStatusModal'
import EmptyState from '../../components/ui/EmptyState'
import Drawer from '../../components/ui/Drawer'
import Pagination from '../../components/ui/Pagination'
import { TextSkeleton } from '../../components/ui/Skeleton'
import { formatUSD, formatDate, estimatedDelivery } from '../../utils/format'
import { bagWeightLb } from '../../utils/stock'
import { openInvoice } from '../../utils/invoice'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useNotifications } from '../../context/NotificationContext'
import { ApiError } from '../../api/client'
import orderApi from '../../api/orderApi'
import returnApi from '../../api/returnApi'
import { normalizeReturnRequests, orderIdsMatch, paymentMethodLabel, returnStatusLabel, displayOrderIdToDbId } from '../../data/returnRequests'

// Single dropdown replaces the old row of tabs - "Cancelled" is now a
// selectable status too (it wasn't before), and "Returns"/"Refunds" filter
// against the customer's return-request data rather than deliveryStatus.
const FILTER_OPTIONS = ['All Orders', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returns', 'Refunds']
const PAGE_SIZE = 20

const itemNames = (o) => (o.items?.length ? o.items.map((i) => i.name).join(', ') : o.riceName)
const itemQtys = (o) => (o.items?.length ? o.items.map((i) => `${bagWeightLb(i.weight)}lb Bag x${i.qty}`).join(', ') : o.quantity)

export default function Orders() {
  const { user } = useAuth()
  const [ordersData, setOrdersData] = useState([])
  const [filter, setFilter] = useState('All Orders')
  const [page, setPage] = useState(1)
  const [cancellingId, setCancellingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)
  const [returnRequests, setReturnRequests] = useState([])
  const [cancelTarget, setCancelTarget] = useState(null)
  const [returnTarget, setReturnTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const { showToast } = useToast()
  const { notify } = useNotifications()

  useEffect(() => {
    // Offline (in-store/walk-in) orders are booked by staff for record-keeping
    // only - they shouldn't show up here (the customer never placed it online,
    // and the online return flow isn't meant to apply to a walk-in sale).
    // Admin's Orders page is the only place these should be visible.
    orderApi.listMine()
      .then((data) => setOrdersData(data.filter((o) => (o.orderType || 'online') !== 'offline')))
      .catch(() => setOrdersData([]))
      .finally(() => setLoading(false))
  }, [])

  const refreshReturnRequests = () => {
    returnApi.listMine().then((data) => setReturnRequests(normalizeReturnRequests(data))).catch(() => setReturnRequests([]))
  }
  useEffect(refreshReturnRequests, [])

  const findReturnRequest = (orderId) => returnRequests.find((request) => orderIdsMatch(orderId, request.orderId))

  // Newest first, regardless of whatever order the API happens to return -
  // orders id numbering (RBZ-<year>-<n>) increments monotonically with the
  // underlying DB id, so sorting by that trailing number is a reliable
  // chronological order even when several orders share the same calendar day.
  const sortedOrders = useMemo(
    () => [...ordersData].sort((a, b) => displayOrderIdToDbId(b.id) - displayOrderIdToDbId(a.id)),
    [ordersData]
  )

  const filteredOrders = useMemo(() => {
    if (filter === 'All Orders') return sortedOrders
    if (filter === 'Returns') return sortedOrders.filter((o) => !!findReturnRequest(o.id))
    if (filter === 'Refunds') return sortedOrders.filter((o) => findReturnRequest(o.id)?.status === 'REFUNDED')
    return sortedOrders.filter((o) => o.deliveryStatus === filter)
  }, [sortedOrders, filter, returnRequests])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const pageOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleFilterChange = (value) => {
    setFilter(value)
    setPage(1)
  }

  const handleCancel = async (reason) => {
    const orderId = cancelTarget.id
    setCancellingId(orderId)
    try {
      const updatedOrder = await orderApi.cancel(orderId, reason)
      setOrdersData((current) => current.map((order) => order.id === orderId ? updatedOrder : order))
      setViewing((v) => (v?.id === orderId ? updatedOrder : v))
      showToast('Order cancelled', 'success')
      notify('ORDER_CANCELLED', { orderId })
      setCancelTarget(null)
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Order can no longer be cancelled', 'error')
    } finally {
      setCancellingId(null)
    }
  }

  const handleReturnSubmitted = () => {
    refreshReturnRequests()
    setReturnTarget(null)
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Orders' }]} />
      <PageHeader title="My Orders" subtitle="Track and manage all your orders" />

      <div className="mb-6">
        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value)}
          aria-label="Filter orders by status"
          className="input-field !w-auto text-sm font-semibold"
        >
          {FILTER_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
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
      ) : filteredOrders.length === 0 ? (
        <EmptyState icon={Package} title="No orders found" subtitle="You have no orders in this category yet." actionLabel="Start Shopping" actionTo="/products" />
      ) : (
        <>
          <div className="space-y-4">
            {pageOrders.map((o) => {
              const returnRequest = findReturnRequest(o.id)
              return (
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
                    {returnRequest && <StatusPill status={returnStatusLabel(returnRequest.status)} />}
                    <span className="text-xs text-ink/40">{o.paymentStatus === 'Paid' ? 'Paid' : 'Payment pending'}</span>
                  </div>
                  {o.deliveryStatus === 'Cancelled' && (
                    <div className="mt-2 space-y-2"><CancellationInfo order={o} /><RefundInfo order={o} /></div>
                  )}
                  {returnRequest && (
                    <div className="mt-3 rounded-xl bg-primary-50/70 border border-primary-100 px-3 py-2 text-xs text-ink/60">
                      Return {returnRequest.returnNumber}: <span className="font-semibold text-ink/75">{returnRequest.items.map((item) => `${item.label} x${item.quantity}`).join(', ')}</span>
                      {returnRequest.status === 'REFUNDED' && (
                        <span className="block mt-0.5 font-semibold text-leaf-700">Refunded: {formatUSD(returnRequest.refundAmount)}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 sm:text-right sm:min-w-[140px]">
                  <p className="font-bold text-lg">{formatUSD(o.amount)}</p>
                  <div className="flex sm:flex-col gap-2 w-full">
                    <button onClick={() => setViewing(o)} className="btn text-xs px-3 py-1.5 bg-primary-50 text-primary-700 w-full justify-center"><Eye className="w-3.5 h-3.5" /> View Details</button>
                    <button onClick={() => openInvoice(o, user)} className="btn text-xs px-3 py-1.5 bg-black/5 text-ink/70 w-full justify-center"><Download className="w-3.5 h-3.5" /> Invoice</button>
                    {o.deliveryStatus === 'Delivered' && (
                      returnRequest ? (
                        <button onClick={() => setStatusTarget(returnRequest)} className="btn text-xs px-3 py-1.5 bg-leaf-50 text-leaf-700 w-full justify-center">
                          <RotateCcw className="w-3.5 h-3.5" /> Return Status
                        </button>
                      ) : (
                        <button onClick={() => setReturnTarget(o)} className="btn text-xs px-3 py-1.5 bg-leaf-50 text-leaf-700 w-full justify-center">
                          <RotateCcw className="w-3.5 h-3.5" /> Request Return
                        </button>
                      )
                    )}
                    {['Pending', 'Processing'].includes(o.deliveryStatus) && (
                      <button onClick={() => setCancelTarget(o)} className="btn text-xs px-3 py-1.5 bg-red-50 text-red-500 w-full justify-center">
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {/* Order details - slide-in from the right, using the order already in
          hand from the list above (no extra fetch), matching the same pattern
          used on the admin Orders page. */}
      <Drawer open={!!viewing} onClose={() => setViewing(null)} title="Order Details" width="max-w-lg">
        {viewing && (
          <div className="p-5 space-y-5 text-sm">
            {(() => {
              const returnRequest = findReturnRequest(viewing.id)
              return returnRequest ? (
                <div className="rounded-xl border border-primary-100 bg-primary-50/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-ink/40">Return Request</p>
                      <p className="font-bold mt-0.5">{returnRequest.returnNumber}</p>
                    </div>
                    <StatusPill status={returnStatusLabel(returnRequest.status)} />
                  </div>
                  <div className="mt-3 text-xs text-ink/60 space-y-1">
                    <p>{returnRequest.items.map((item) => `${item.label} x${item.quantity}`).join(', ')}</p>
                    <p>{returnRequest.status === 'REFUNDED' ? 'Refunded' : 'Estimated refund'}: <span className="font-bold text-primary-700">{formatUSD(returnRequest.refundAmount)}</span> to {paymentMethodLabel(returnRequest)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button onClick={() => setStatusTarget(returnRequest)} className="btn text-xs px-3 py-1.5 bg-white text-primary-700 border border-primary-100">View Return Status</button>
                  </div>
                </div>
              ) : null
            })()}
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
              {viewing.deliveryStatus === 'Cancelled' && (
                <div className="mt-2 space-y-2"><CancellationInfo order={viewing} /><RefundInfo order={viewing} /></div>
              )}
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

            <button onClick={() => openInvoice(viewing, user)} className="btn w-full bg-black/5 text-ink/70">
              <Download className="w-4 h-4" /> Download Invoice
            </button>

            {['Pending', 'Processing'].includes(viewing.deliveryStatus) && (
              <button onClick={() => setCancelTarget(viewing)} className="btn w-full bg-red-50 text-red-500">
                <XCircle className="w-4 h-4" /> Cancel Order
              </button>
            )}
            {viewing.deliveryStatus === 'Delivered' && !findReturnRequest(viewing.id) && (
              <button onClick={() => setReturnTarget(viewing)} className="btn w-full bg-leaf-50 text-leaf-700">
                <RotateCcw className="w-4 h-4" /> Request Return
              </button>
            )}
          </div>
        )}
      </Drawer>

      <CancelOrderModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        order={cancelTarget}
        onConfirm={handleCancel}
        submitting={cancellingId === cancelTarget?.id}
      />

      <ReturnRequestModal
        open={!!returnTarget}
        onClose={() => setReturnTarget(null)}
        order={returnTarget}
        onSubmitted={handleReturnSubmitted}
      />

      <ReturnStatusModal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        request={statusTarget}
      />
    </div>
  )
}
