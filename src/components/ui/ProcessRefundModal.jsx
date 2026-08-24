import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Modal from './Modal'
import { formatUSD } from '../../utils/format'
import { refundableAmount } from '../../utils/refund'

// Product amount only, same policy as a product return - delivery charge and
// tax are excluded, not refunded back.
//
// No "Refund Reference" input - there's no real payment gateway wired up yet
// (no bank/card details are captured anywhere), so there's no actual
// transaction id for an admin to reference here; asking for one would just
// invite made-up data. Once a real gateway exists, the reference will come
// from the transaction it captured at checkout time, not be typed in by
// hand - at which point this modal can show it automatically instead of
// asking for it.
export default function ProcessRefundModal({ open, onClose, order, onConfirm, submitting }) {
  const [refundNote, setRefundNote] = useState('')

  useEffect(() => {
    if (open) setRefundNote('')
  }, [open, order?.id])

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const submit = () => onConfirm({ refundNote: refundNote.trim() })

  if (!order) return null

  return (
    <Modal open={open} onClose={handleClose} title="Process Refund">
      <div className="space-y-4">
        <div className="card p-3.5 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-ink/50">Order</span><span className="font-semibold">{order.id}</span></div>
          {order.customerName && (
            <div className="flex justify-between"><span className="text-ink/50">Customer</span><span className="font-semibold">{order.customerName}</span></div>
          )}
          <div className="flex justify-between"><span className="text-ink/50">Amount Paid</span><span className="font-semibold">{formatUSD(order.amount)}</span></div>
          <div className="flex justify-between border-t border-black/10 pt-1.5"><span className="text-ink/50">Refund Amount</span><span className="font-bold text-primary-700">{formatUSD(refundableAmount(order))}</span></div>
        </div>
        <p className="text-xs text-ink/50">Delivery charges and tax are not refundable, per RiceBazaar's refund policy.</p>

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
