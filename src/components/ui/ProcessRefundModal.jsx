import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Modal from './Modal'
import { formatUSD } from '../../utils/format'

// Full order amount, not a per-item calculation - a cancelled order never
// shipped, so there's nothing to prorate the way a product return is
// (product-amount-only, per returned quantity). This refunds the whole
// thing back through the same payment method it was collected on.
export default function ProcessRefundModal({ open, onClose, order, onConfirm, submitting }) {
  const [refundReference, setRefundReference] = useState('')
  const [refundNote, setRefundNote] = useState('')

  useEffect(() => {
    if (open) { setRefundReference(''); setRefundNote('') }
  }, [open, order?.id])

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const submit = () => onConfirm({ refundReference: refundReference.trim(), refundNote: refundNote.trim() })

  if (!order) return null

  return (
    <Modal open={open} onClose={handleClose} title="Process Refund">
      <div className="space-y-4">
        <div className="card p-3.5 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-ink/50">Order</span><span className="font-semibold">{order.id}</span></div>
          {order.customerName && (
            <div className="flex justify-between"><span className="text-ink/50">Customer</span><span className="font-semibold">{order.customerName}</span></div>
          )}
          <div className="flex justify-between border-t border-black/10 pt-1.5"><span className="text-ink/50">Refund Amount</span><span className="font-bold text-primary-700">{formatUSD(order.amount)}</span></div>
        </div>

        <div>
          <label className="label-field" htmlFor="refund-reference">Refund Reference (Optional)</label>
          <input id="refund-reference" value={refundReference} onChange={(e) => setRefundReference(e.target.value)} placeholder="e.g. transaction/refund id from your payment provider" className="input-field" />
        </div>

        <div>
          <label className="label-field" htmlFor="refund-note">Note (Optional)</label>
          <textarea id="refund-note" value={refundNote} onChange={(e) => setRefundNote(e.target.value)} rows={3} placeholder="Any additional details..." className="input-field resize-none" />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={handleClose} disabled={submitting} className="btn-outline flex-1 justify-center disabled:opacity-60">Cancel</button>
          <button type="button" onClick={submit} disabled={submitting} className="btn-primary flex-1 justify-center disabled:opacity-60">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {submitting ? 'Processing...' : 'Confirm Refund'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
