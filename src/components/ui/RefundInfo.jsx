import { formatDate, formatUSD } from '../../utils/format'

const isCod = (order) => (order?.paymentMethod || '').toLowerCase() === 'cod'

// Shown for a cancelled order that was actually paid for (anything but COD -
// COD never charges anything up front, so there's nothing to give back).
// Reads `paymentStatus === 'Refunded'` plus `refundProcessedAt`/
// `refundReference` once the backend adds them (see backend prompt) - until
// then those fields simply aren't there yet, so this renders the "pending"
// state, not a fabricated "refunded" one.
export default function RefundInfo({ order }) {
  if (order?.deliveryStatus !== 'Cancelled' || isCod(order)) return null

  if (order.paymentStatus === 'Refunded') {
    return (
      <div className="rounded-xl bg-leaf-50 border border-leaf-100 px-3.5 py-2.5 text-xs text-leaf-700 space-y-0.5">
        <p className="font-semibold">
          Refunded {formatUSD(order.amount)}{order.refundProcessedAt ? ` on ${formatDate(order.refundProcessedAt)}` : ''}
        </p>
        {order.refundReference && <p className="text-leaf-600/80">Reference: {order.refundReference}</p>}
      </div>
    )
  }

  if (order.paymentStatus === 'Paid') {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5 text-xs text-amber-700">
        <p className="font-semibold">Refund pending &middot; {formatUSD(order.amount)} will be refunded to your original payment method.</p>
      </div>
    )
  }

  return null
}
