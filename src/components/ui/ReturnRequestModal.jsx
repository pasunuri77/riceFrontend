import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, Upload, X, Package, MapPin, ArrowLeft } from 'lucide-react'
import Modal from './Modal'
import FormField from './FormField'
import { TextSkeleton } from './Skeleton'
import { formatUSD, formatDate } from '../../utils/format'
import { paymentMethodLabel } from '../../data/returnRequests'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import returnApi from '../../api/returnApi'
import settingsApi from '../../api/settingsApi'

const REASONS = [
  'Damaged product',
  'Wrong product received',
  'Wrong quantity received',
  'Product quality issue',
  'Product not as expected',
  'Incorrect item',
  'Packaging issue',
  'Other',
]

const DETAILS_MAX = 500
const MAX_PHOTOS = 3
const MAX_PHOTO_MB = 5

function emptyForm() {
  return { quantities: {}, reason: '', otherReason: '', details: '', photos: [] }
}

// Single consolidated return form + review, in one modal - no multi-page
// wizard, no navigation away from My Orders. `order` is the order row/drawer
// object already in hand on the caller's side (used for header display only);
// the actual returnable items/quantities/payment display come from the
// dedicated GET /api/orders/:id/returnable-items call below, since that's
// the authoritative source for what's still eligible to return.
export default function ReturnRequestModal({ open, onClose, order, onSubmitted }) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [returnable, setReturnable] = useState(null)
  const [policyText, setPolicyText] = useState('')
  const [stage, setStage] = useState('form')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!open || !order) return
    setStage('form')
    setForm(emptyForm())
    setLoading(true)
    setLoadError('')
    returnApi.getReturnableItems(order.id)
      .then(setReturnable)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Unable to load return details for this order.'))
      .finally(() => setLoading(false))

    // Purely optional, store-configured copy - only rendered if the backend
    // actually provides it (no hardcoded fallback text), see the Refund
    // Policy Notice section below.
    settingsApi.get()
      .then((settings) => setPolicyText(settings?.returnPolicyText || ''))
      .catch(() => setPolicyText(''))
  }, [open, order?.id])

  const items = returnable?.items || []

  const setQty = (orderItemId, delta) => {
    setForm((f) => {
      const item = items.find((i) => i.orderItemId === orderItemId)
      const max = item?.returnableQuantity || 0
      const current = f.quantities[orderItemId] || 0
      const next = Math.max(0, Math.min(max, current + delta))
      return { ...f, quantities: { ...f.quantities, [orderItemId]: next } }
    })
  }

  const selectedItems = useMemo(
    () => items
      .map((item) => ({ ...item, qty: form.quantities[item.orderItemId] || 0 }))
      .filter((item) => item.qty > 0),
    [items, form.quantities]
  )

  const estimatedRefund = useMemo(
    () => selectedItems.reduce((sum, item) => sum + (item.unitPrice || 0) * item.qty, 0),
    [selectedItems]
  )

  const reasonValid = form.reason && (form.reason !== 'Other' || form.otherReason.trim())
  const canContinue = selectedItems.length > 0 && !!reasonValid && form.photos.length <= MAX_PHOTOS

  const addPhotos = (fileList) => {
    const incoming = Array.from(fileList || [])
    const room = MAX_PHOTOS - form.photos.length
    if (room <= 0) return
    const accepted = incoming
      .filter((file) => file.type.startsWith('image/'))
      .filter((file) => file.size <= MAX_PHOTO_MB * 1024 * 1024)
      .slice(0, room)
      .map((file) => ({ file, url: URL.createObjectURL(file) }))
    if (accepted.length < incoming.length) {
      showToast(`Only image files up to ${MAX_PHOTO_MB}MB are accepted, and up to ${MAX_PHOTOS} photos total.`, 'error')
    }
    setForm((f) => ({ ...f, photos: [...f.photos, ...accepted] }))
  }

  const removePhoto = (url) => {
    setForm((f) => {
      const target = f.photos.find((p) => p.url === url)
      if (target) URL.revokeObjectURL(target.url)
      return { ...f, photos: f.photos.filter((p) => p.url !== url) }
    })
  }

  const handleClose = () => {
    if (submitting) return
    form.photos.forEach((p) => URL.revokeObjectURL(p.url))
    onClose()
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      // returnApi.submit() only accepts { orderId, reason, details, refundMethod,
      // items[{id, returnQuantity}] } today - refund method is always the
      // original payment method (no store-credit/PayPal/gift-card picker
      // shown, per the current policy), and photos aren't sent since the
      // backend has no field to receive them yet (see backend prompt).
      const finalReason = form.reason === 'Other' ? form.otherReason.trim() : form.reason
      const request = await returnApi.submit({
        orderId: order.id,
        reason: finalReason,
        details: form.details.trim(),
        refundMethod: 'original',
        items: selectedItems.map((item) => ({ id: item.orderItemId, returnQuantity: item.qty })),
      })
      showToast('Return request submitted', 'success')
      onSubmitted?.(request)
      handleClose()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to submit return request.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!order) return null

  return (
    <Modal open={open} onClose={handleClose} title={stage === 'review' ? 'Review Return Request' : 'Request Return'} maxWidth="max-w-2xl">
      {loading ? (
        <div className="space-y-3">
          <TextSkeleton className="h-4 w-2/3" />
          <TextSkeleton className="h-4 w-1/2" />
          <TextSkeleton className="h-24 w-full" />
        </div>
      ) : loadError ? (
        <p className="text-sm text-red-500">{loadError}</p>
      ) : (
        <div className="space-y-5 text-sm">
          {/* Order Information - shown in both stages so the customer always knows which order this is */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Order Information</h5>
            <div className="card p-3.5 space-y-2">
              <div className="flex justify-between"><span className="text-ink/50">Order ID</span><span className="font-semibold">{order.id}</span></div>
              <div className="flex justify-between"><span className="text-ink/50">Order Date</span><span className="font-semibold">{formatDate(order.date)}</span></div>
              <div className="flex justify-between items-start gap-3">
                <span className="text-ink/50 shrink-0 flex items-center gap-1"><MapPin className="w-3 h-3" /> Delivery Address</span>
                <span className="font-semibold text-right">{order.address || '--'}</span>
              </div>
            </div>
          </div>

          {stage === 'form' ? (
            <>
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2">Items Being Returned</h5>
                <div className="card divide-y divide-black/5">
                  {items.length === 0 && <p className="p-3.5 text-ink/50">No items are eligible for return on this order.</p>}
                  {items.map((item) => {
                    const qty = form.quantities[item.orderItemId] || 0
                    return (
                      <div key={item.orderItemId} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{item.productName}</p>
                          <p className="text-xs text-ink/40">
                            {item.variantName ? `${item.variantName} • ` : ''}{formatUSD(item.unitPrice)} each • {item.returnableQuantity} eligible
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button type="button" onClick={() => setQty(item.orderItemId, -1)} disabled={qty === 0} className="w-7 h-7 rounded-lg border border-black/10 flex items-center justify-center disabled:opacity-30">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center font-semibold">{qty}</span>
                          <button type="button" onClick={() => setQty(item.orderItemId, 1)} disabled={qty >= item.returnableQuantity} className="w-7 h-7 rounded-lg border border-black/10 flex items-center justify-center disabled:opacity-30">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <FormField label="Return Reason">
                <select value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className="input-field">
                  <option value="">Select a reason...</option>
                  {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </FormField>

              {form.reason === 'Other' && (
                <FormField label="Please specify your reason">
                  <input
                    value={form.otherReason}
                    onChange={(e) => setForm((f) => ({ ...f, otherReason: e.target.value }))}
                    placeholder="Tell us what happened..."
                    className="input-field"
                  />
                </FormField>
              )}

              <FormField label="Tell us more (Optional)" maxLength={DETAILS_MAX} currentLength={form.details.length}>
                <textarea
                  value={form.details}
                  onChange={(e) => setForm((f) => ({ ...f, details: e.target.value.slice(0, DETAILS_MAX) }))}
                  maxLength={DETAILS_MAX}
                  rows={4}
                  placeholder="Any additional details about this return..."
                  className="input-field resize-none"
                />
              </FormField>

              <div>
                <p className="label-field">Upload Photos (Optional) &middot; Maximum {MAX_PHOTOS}</p>
                <div className="flex flex-wrap gap-2.5">
                  {form.photos.map((p) => (
                    <div key={p.url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-black/10">
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePhoto(p.url)} className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 rounded-full p-1" aria-label="Remove photo">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {form.photos.length < MAX_PHOTOS && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-black/15 flex flex-col items-center justify-center text-ink/40 cursor-pointer hover:border-primary-300 hover:text-primary-500">
                      <Upload className="w-4 h-4" />
                      <span className="text-[10px] mt-1">Add</span>
                      <input type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
                    </label>
                  )}
                </div>
                <p className="text-xs text-ink/40 mt-1.5">JPG or PNG, up to {MAX_PHOTO_MB}MB each.</p>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2">Refund Information</h5>
                <div className="card p-3.5 space-y-2">
                  <div className="flex justify-between"><span className="text-ink/50">Original Payment Method</span><span className="font-semibold">{paymentMethodLabel(returnable)}</span></div>
                  <div className="flex justify-between"><span className="text-ink/50">Amount Originally Paid</span><span className="font-semibold">{formatUSD(order.amount)}</span></div>
                  <div className="border-t border-black/10 pt-2 flex justify-between items-center">
                    <span className="font-bold">Estimated Refund</span>
                    <span className="font-extrabold text-primary-700">{formatUSD(estimatedRefund)}</span>
                  </div>
                </div>
                {policyText && <p className="text-xs text-ink/50 mt-2">{policyText}</p>}
              </div>

              <button
                type="button"
                onClick={() => canContinue && setStage('review')}
                disabled={!canContinue}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2">Items Being Returned</h5>
                <div className="card divide-y divide-black/5">
                  {selectedItems.map((item) => (
                    <div key={item.orderItemId} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{item.productName}</p>
                        <p className="text-xs text-ink/40">{item.variantName ? `${item.variantName} • ` : ''}Qty: {item.qty}</p>
                      </div>
                      <p className="font-bold shrink-0">{formatUSD(item.unitPrice * item.qty)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2">Return Reason</h5>
                <p className="card p-3.5">{form.reason === 'Other' ? form.otherReason : form.reason}</p>
              </div>

              {form.details && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2">Additional Details</h5>
                  <p className="card p-3.5 text-ink/70">{form.details}</p>
                </div>
              )}

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2">Photos</h5>
                <p className="card p-3.5">{form.photos.length > 0 ? `${form.photos.length} photo${form.photos.length === 1 ? '' : 's'} attached` : 'No photos attached'}</p>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2">Refund Information</h5>
                <div className="card p-3.5 space-y-2">
                  <div className="flex justify-between"><span className="text-ink/50">Original Payment Method</span><span className="font-semibold">{paymentMethodLabel(returnable)}</span></div>
                  <div className="flex justify-between"><span className="text-ink/50">Amount Originally Paid</span><span className="font-semibold">{formatUSD(order.amount)}</span></div>
                  <div className="border-t border-black/10 pt-2 flex justify-between items-center">
                    <span className="font-bold">Estimated Refund</span>
                    <span className="font-extrabold text-primary-700">{formatUSD(estimatedRefund)}</span>
                  </div>
                </div>
                {policyText && <p className="text-xs text-ink/50 mt-2">{policyText}</p>}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setStage('form')} disabled={submitting} className="btn-outline flex-1 justify-center disabled:opacity-60">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button type="button" onClick={submit} disabled={submitting} className="btn-primary flex-1 justify-center disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
