import { useEffect, useState } from 'react'
import { XCircle } from 'lucide-react'
import Modal from './Modal'
import FormField from './FormField'
import { formatUSD } from '../../utils/format'

const REASON_MAX = 500

// Shared by the customer cancel flow (Orders.jsx, OrderDetail.jsx) and the
// admin/employee cancel flow (Admin/Orders.jsx) - a reason is always required
// so nobody cancels blind, and it's capped at REASON_MAX both here and on the
// backend, which is the actual source of truth for the limit.
export default function CancelOrderModal({ open, onClose, order, onConfirm, submitting, title = 'Cancel Order' }) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) setReason('')
  }, [open, order?.id])

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const submit = () => {
    const trimmed = reason.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  if (!order) return null

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className="space-y-4">
        <div className="card p-3.5 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-ink/50">Order</span><span className="font-semibold">{order.id}</span></div>
          {order.customerName && (
            <div className="flex justify-between"><span className="text-ink/50">Customer</span><span className="font-semibold">{order.customerName}</span></div>
          )}
          <div className="flex justify-between"><span className="text-ink/50">Amount</span><span className="font-semibold">{formatUSD(order.amount)}</span></div>
        </div>

        <FormField label="Reason for cancellation" maxLength={REASON_MAX} currentLength={reason.length}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
            maxLength={REASON_MAX}
            rows={5}
            placeholder="Let them know why this order is being cancelled..."
            className="input-field resize-none"
            autoFocus
          />
        </FormField>

        <div className="flex gap-2">
          <button type="button" onClick={handleClose} disabled={submitting} className="btn-outline flex-1 justify-center disabled:opacity-60">
            Keep Order
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !reason.trim()}
            className="btn bg-red-600 text-white flex-1 justify-center disabled:opacity-60"
          >
            <XCircle className="w-4 h-4" aria-hidden="true" /> {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
