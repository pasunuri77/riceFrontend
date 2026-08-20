import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ImagePlus, Info, Minus, Package, Plus, Trash2 } from 'lucide-react'
import Breadcrumb from '../../components/ui/Breadcrumb'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
import StatusPill from '../../components/ui/StatusPill'
import { TextSkeleton } from '../../components/ui/Skeleton'
import { formatDate, formatUSD } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import returnApi from '../../api/returnApi'
import {
  getReturnOrderSnapshot,
  MOCK_RETURN_ORDER,
  paymentMethodLabel,
  returnableItems,
  selectedRefund,
  RETURN_REASONS,
} from '../../data/returnRequests'

const steps = ['Items', 'Reason', 'Details', 'Refund', 'Review']

function ItemImage({ src }) {
  if (src) return <img src={src} alt="" className="w-16 h-16 rounded-lg object-cover bg-primary-50 shrink-0" />
  return (
    <div className="w-16 h-16 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center shrink-0">
      <Package className="w-7 h-7" />
    </div>
  )
}

function ReturnSummary({ items, compact = false }) {
  const total = selectedRefund(items)
  return (
    <div className={`card ${compact ? 'p-4' : 'p-5'} h-fit`}>
      <h3 className="font-bold mb-3">Return Summary</h3>
      <div className="space-y-2 text-sm">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{item.label}</p>
              <p className="text-xs text-ink/45">{item.returnQuantity} x {formatUSD(item.unitPrice)}</p>
            </div>
            <span className="font-semibold">{formatUSD(item.returnQuantity * item.unitPrice)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-black/10 mt-3 pt-3 flex items-center justify-between">
        <span className="font-bold">Estimated Refund</span>
        <span className="font-extrabold text-lg text-leaf-700">{formatUSD(total)}</span>
      </div>
      <p className="mt-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700">
        Refund includes product amounts only. Delivery charges and tax are not refundable.
      </p>
    </div>
  )
}

export default function ReturnRequest() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const snapshot = getReturnOrderSnapshot(orderId) || (orderId === MOCK_RETURN_ORDER.id ? MOCK_RETURN_ORDER : null)
  const [order, setOrder] = useState(() => snapshot || { ...MOCK_RETURN_ORDER, id: orderId || MOCK_RETURN_ORDER.id, items: [] })
  const [step, setStep] = useState(0)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reason, setReason] = useState('Item is damaged')
  const [details, setDetails] = useState('The rice package was torn and some rice is spilled.')
  const [photos, setPhotos] = useState([
    { id: 'photo-1', name: 'Damaged package' },
    { id: 'photo-2', name: 'Spilled rice' },
    { id: 'photo-3', name: 'Box corner' },
  ])
  const [refundMethod, setRefundMethod] = useState('original')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setLoadError('')
    returnApi.getReturnableItems(orderId)
      .then((data) => {
        if (ignore) return
        const apiOrder = {
          ...(snapshot || {}),
          id: data.orderDisplayId || orderId,
          numericId: data.orderId,
          paymentMethod: data.paymentMethod,
          paymentDisplay: data.paymentDisplay,
          items: data.items || [],
        }
        setOrder(apiOrder)
        setItems(returnableItems(apiOrder).map((item) => ({ ...item, returnQuantity: item.returnableQuantity })))
      })
      .catch((err) => {
        if (ignore) return
        setLoadError(err instanceof ApiError ? err.message : 'Unable to load returnable items.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => { ignore = true }
  }, [orderId])

  const selectedItems = useMemo(() => items.filter((item) => item.returnQuantity > 0), [items])
  const refundAmount = useMemo(() => selectedRefund(selectedItems), [selectedItems])
  const paymentDisplay = paymentMethodLabel(order)
  const canContinue = selectedItems.length > 0

  const setQuantity = (orderItemId, delta) => {
    setItems((current) => current.map((item) => (
      item.id === orderItemId
        ? { ...item, returnQuantity: Math.min(item.returnableQuantity, Math.max(0, item.returnQuantity + delta)) }
        : item
    )))
  }

  const next = () => {
    if (!canContinue) {
      showToast('Please select at least one item to return.', 'error')
      return
    }
    setStep((value) => Math.min(steps.length - 1, value + 1))
  }

  const submit = async () => {
    if (!canContinue || submitting) return
    setSubmitting(true)
    try {
      const request = await returnApi.submit({ orderId: order.numericId || order.id, items, reason, details, refundMethod })
      showToast('Return request submitted', 'success')
      navigate(`/dashboard/returns/${request.id}/success`)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to submit return request.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Orders', to: '/dashboard/orders' }, { label: `Return ${orderId}` }]} />
        <TextSkeleton className="h-8 w-64 mb-5" />
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-5"><TextSkeleton className="h-5 w-1/2" /><TextSkeleton className="h-4 w-1/3 mt-3" /></div>)}</div>
          <div className="card p-5"><TextSkeleton className="h-5 w-2/3" /><TextSkeleton className="h-4 w-full mt-4" /></div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div>
        <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Orders', to: '/dashboard/orders' }, { label: `Return ${orderId}` }]} />
        <EmptyState icon={Package} title="Unable to start return" subtitle={loadError} actionLabel="Back to My Orders" actionTo="/dashboard/orders" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div>
        <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Orders', to: '/dashboard/orders' }, { label: `Return ${orderId}` }]} />
        <EmptyState icon={Package} title="No returnable items" subtitle="This order has no remaining items eligible for return." actionLabel="Back to My Orders" actionTo="/dashboard/orders" />
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Orders', to: '/dashboard/orders' }, { label: `Return ${order.id}` }]} />
      <PageHeader
        title={step === 4 ? 'Review Return Details' : step === 3 ? 'Refund Method' : step === 2 ? 'Return Details' : step === 1 ? 'Reason for Return' : 'Request a Return'}
        subtitle={`Order ID: ${order.id}`}
        action={<Link to="/dashboard/orders" className="btn-outline text-sm"><ArrowLeft className="w-4 h-4" /> My Orders</Link>}
      />

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {steps.map((label, index) => (
          <span key={label} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${index === step ? 'bg-primary-500 text-white' : index < step ? 'bg-leaf-100 text-leaf-700' : 'bg-white border border-black/10 text-ink/45'}`}>
            {index + 1}. {label}
          </span>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-4">
          {step === 0 && (
            <>
              <div className="card p-5">
                <h3 className="font-bold">Select items to return</h3>
                <p className="text-sm text-ink/50 mt-1">Adjust quantities. Items set to zero will not be included.</p>
              </div>
              {items.map((item) => {
                const minusDisabled = item.returnQuantity === 0
                const plusDisabled = item.returnQuantity === item.returnableQuantity
                return (
                  <div key={item.id} className="card p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <ItemImage src={item.imageUrl} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-sm text-ink/55">{item.label}</p>
                        <p className="text-sm font-semibold mt-1">{formatUSD(item.unitPrice)} each</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xs text-ink/45 mb-2">Ordered: {item.orderedQuantity}</p>
                        <div className="flex items-center gap-2">
                          <button aria-label={`Decrease ${item.label}`} disabled={minusDisabled} onClick={() => setQuantity(item.id, -1)} className="btn w-9 h-9 bg-white border border-black/10 text-ink/70 disabled:opacity-35"><Minus className="w-4 h-4" /></button>
                          <span className="w-10 h-9 rounded-lg bg-primary-50 text-primary-700 font-bold flex items-center justify-center">{item.returnQuantity}</span>
                          <button aria-label={`Increase ${item.label}`} disabled={plusDisabled} onClick={() => setQuantity(item.id, 1)} className="btn w-9 h-9 bg-white border border-black/10 text-ink/70 disabled:opacity-35"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {step === 1 && (
            <div className="card p-5">
              <h3 className="font-bold mb-4">Please select a reason</h3>
              <div className="space-y-3">
                {RETURN_REASONS.map((option) => (
                  <label key={option} className="flex items-center gap-3 text-sm font-medium">
                    <input type="radio" name="reason" checked={reason === option} onChange={() => setReason(option)} className="accent-primary-600" />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="card p-5">
                <h3 className="font-bold mb-3">Items being returned</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="rounded-lg border border-black/10 p-3">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-ink/50">{item.label} x {item.returnQuantity}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-5">
                <label className="label-field" htmlFor="return-details">Tell us more</label>
                <textarea id="return-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} rows={5} className="input-field resize-none" />
                <p className="text-right text-xs text-ink/40 mt-1">{details.length}/500</p>
              </div>
              <div className="card p-5">
                <h3 className="font-bold mb-3">Add photos</h3>
                <div className="flex flex-wrap gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative w-24 h-24 rounded-lg bg-primary-50 border border-black/10 flex items-center justify-center text-center px-2">
                      <span className="text-[11px] font-semibold text-ink/55">{photo.name}</span>
                      <button aria-label={`Remove ${photo.name}`} onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <button onClick={() => setPhotos((current) => [...current, { id: `photo-${Date.now()}`, name: 'New photo' }])} className="w-24 h-24 rounded-lg border-2 border-dashed border-black/15 text-primary-600 flex flex-col items-center justify-center text-xs font-bold">
                    <ImagePlus className="w-5 h-5 mb-1" /> Add
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="card p-5 space-y-5">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 flex gap-2 text-sm text-blue-700">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Once your return is approved, the refund will be issued to your selected method.</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-ink/45">Refund will be sent to</p>
                <p className="font-bold mt-1">{paymentDisplay}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-ink/45 mb-2">Choose a refund method</p>
                {[
                  ['original', 'Original Payment Method', 'Recommended'],
                  ['store-credit', 'Store Credit', 'Get 5% extra'],
                  ['paypal', 'PayPal', ''],
                  ['gift-card', 'Gift Card', ''],
                ].map(([value, label, note]) => (
                  <label key={value} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="flex items-center gap-3">
                      <input type="radio" checked={refundMethod === value} onChange={() => setRefundMethod(value)} className="accent-primary-600" />
                      <span className="font-semibold">{label}</span>
                    </span>
                    {note && <span className="badge bg-leaf-100 text-leaf-700 normal-case tracking-normal">{note}</span>}
                  </label>
                ))}
              </div>
              <div className="rounded-lg bg-primary-50 p-4 flex items-center justify-between">
                <span className="font-bold">Refund amount</span>
                <span className="font-extrabold text-xl text-leaf-700">{formatUSD(refundAmount)}</span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="card p-5 space-y-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-leaf-600" />
                <h3 className="font-bold">Ready to submit</h3>
              </div>
              <div className="divide-y divide-black/5 border border-black/5 rounded-lg">
                {selectedItems.map((item) => (
                  <div key={item.id} className="p-3 grid grid-cols-4 gap-2 text-sm">
                    <span className="col-span-2 font-semibold">{item.label}</span>
                    <span>{item.returnQuantity} x {formatUSD(item.unitPrice)}</span>
                    <span className="text-right font-bold">{formatUSD(item.returnQuantity * item.unitPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-primary-50 p-3"><span className="text-ink/45">Reason</span><p className="font-semibold">{reason}</p></div>
                <div className="rounded-lg bg-primary-50 p-3"><span className="text-ink/45">Refund Method</span><p className="font-semibold">{paymentDisplay}</p></div>
              </div>
            </div>
          )}
        </div>

        <ReturnSummary items={items} />
      </div>

      <div className="flex items-center justify-between gap-3 mt-6">
        <button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0 || submitting} className="btn-outline text-sm disabled:opacity-50">Back</button>
        {step === steps.length - 1 ? (
          <button onClick={submit} disabled={!canContinue || submitting} className="btn-primary text-sm min-w-[190px]">{submitting ? 'Submitting...' : 'Submit Return Request'}</button>
        ) : (
          <button onClick={next} disabled={!canContinue} className="btn-primary text-sm min-w-[140px]">Continue</button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill status="Delivered" />
        <span className="text-xs text-ink/45">{order.deliveredAt ? `Delivered on ${formatDate(order.deliveredAt)}.` : 'Return eligibility loaded from your order.'}</span>
      </div>
    </div>
  )
}
