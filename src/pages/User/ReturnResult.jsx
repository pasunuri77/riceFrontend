import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, Package, RotateCcw, XCircle } from 'lucide-react'
import Breadcrumb from '../../components/ui/Breadcrumb'
import EmptyState from '../../components/ui/EmptyState'
import StatusPill from '../../components/ui/StatusPill'
import { TextSkeleton } from '../../components/ui/Skeleton'
import { formatDate, formatUSD } from '../../utils/format'
import returnApi from '../../api/returnApi'
import { normalizeReturnRequest, paymentMethodLabel, returnStatusLabel, RETURN_STATUSES } from '../../data/returnRequests'

const STATUS_COPY = {
  success: {
    icon: ClipboardCheck,
    title: 'Return request submitted!',
    tone: 'text-primary-600 bg-primary-50',
    steps: ['We will review your request within 1-2 business days.', 'If approved, you will receive return instructions by email.', 'Once we receive the return, your refund will be issued in 3-5 business days.'],
  },
  approved: {
    icon: CheckCircle2,
    title: 'Return request approved!',
    tone: 'text-leaf-600 bg-leaf-50',
    steps: ['Check your email for return instructions and prepaid return label.', 'Ship the item back within 7 days.', 'Once we receive the return, your refund will be issued in 3-5 business days.'],
  },
  rejected: {
    icon: XCircle,
    title: 'Return request rejected',
    tone: 'text-red-600 bg-red-50',
    steps: ['Review the rejection reason and admin note.', 'Contact support if more evidence is available.', 'The original order remains unchanged.'],
  },
}

export default function ReturnResult() {
  const { requestId, result = 'success' } = useParams()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setLoadError('')
    returnApi.getMine(requestId)
      .then((data) => { if (!ignore) setRequest(normalizeReturnRequest(data)) })
      .catch(() => { if (!ignore) setLoadError('The return request could not be loaded.') })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [requestId])

  const variant = STATUS_COPY[result] || STATUS_COPY.success
  const Icon = variant.icon
  const displayStatus = result === 'approved' ? RETURN_STATUSES.APPROVED : result === 'rejected' ? RETURN_STATUSES.REJECTED : request?.status

  if (loading) {
    return (
      <div>
        <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Returns' }]} />
        <div className="max-w-3xl mx-auto card p-6">
          <TextSkeleton className="h-7 w-64" />
          <TextSkeleton className="h-4 w-80 mt-4" />
          <TextSkeleton className="h-32 w-full mt-6" />
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div>
        <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Returns' }]} />
        <EmptyState icon={RotateCcw} title="Return request not found" subtitle={loadError || 'This return request was not found for your account.'} actionLabel="Back to My Orders" actionTo="/dashboard/orders" />
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Orders', to: '/dashboard/orders' }, { label: request.id }]} />
      <div className="max-w-3xl mx-auto">
        <section className="card p-5 sm:p-7">
          <div className={`w-16 h-16 rounded-2xl ${variant.tone} flex items-center justify-center mb-5`}>
            <Icon className="w-9 h-9" aria-hidden="true" />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold font-display">{variant.title}</h1>
              <p className="text-sm text-ink/50 mt-1">Request {request.returnNumber} for order {request.orderDisplayId}</p>
            </div>
            {displayStatus && <StatusPill status={returnStatusLabel(displayStatus)} />}
          </div>

          <div className="grid sm:grid-cols-3 gap-3 my-6">
            <div className="rounded-xl bg-primary-50 p-3">
              <p className="text-[11px] uppercase font-bold text-ink/40">Estimated Refund</p>
              <p className="font-extrabold text-xl text-primary-700 mt-1">{formatUSD(request.refundAmount)}</p>
            </div>
            <div className="rounded-xl bg-white border border-black/5 p-3">
              <p className="text-[11px] uppercase font-bold text-ink/40">{result === 'approved' ? 'Refund To' : 'Refund Method'}</p>
              <p className="font-bold mt-1">{paymentMethodLabel(request)}</p>
            </div>
            <div className="rounded-xl bg-white border border-black/5 p-3">
              <p className="text-[11px] uppercase font-bold text-ink/40">Requested On</p>
              <p className="font-bold mt-1">{request.requestedOn ? formatDate(request.requestedOn) : '--'}</p>
            </div>
          </div>

          <div>
            <h2 className="font-bold mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-primary-600" /> Selected Items</h2>
            <div className="divide-y divide-black/5 border border-black/5 rounded-xl overflow-hidden">
              {request.items.map((item) => (
                <div key={item.id} className="p-3 flex justify-between gap-3 text-sm">
                  <div><p className="font-semibold">{item.name}</p><p className="text-xs text-ink/45">{item.label} x{item.quantity}</p></div>
                  <p className="font-bold">{formatUSD(item.lineTotal)}</p>
                </div>
              ))}
            </div>
          </div>

          {request.adminNote && (
            <div className="mt-5 rounded-xl bg-red-50 text-red-700 p-4 text-sm">
              <p className="font-bold">Admin note</p>
              <p className="mt-1">{request.adminNote}</p>
            </div>
          )}

          {request.returnInstructions && result === 'approved' && (
            <div className="mt-5 rounded-xl bg-leaf-50 text-leaf-700 p-4 text-sm">
              <p className="font-bold">Return instructions</p>
              <p className="mt-1">{request.returnInstructions}</p>
            </div>
          )}

          <div className="mt-6">
            <h2 className="font-bold mb-3">Next Steps</h2>
            <div className="space-y-2">
              {variant.steps.map((step, idx) => (
                <div key={step} className="flex items-center gap-3 rounded-xl bg-primary-50/60 p-3 text-sm">
                  <span className="w-7 h-7 rounded-full bg-white text-primary-700 font-bold flex items-center justify-center shadow-soft">{idx + 1}</span>
                  <span className="font-medium text-ink/70">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <Link to="/dashboard/orders" className="btn-primary">Back to My Orders</Link>
            <Link to="/dashboard/orders" className="btn-outline">View Return Status</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
