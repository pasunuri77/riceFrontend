import { useEffect, useState } from 'react'
import { Camera, CheckCircle2, MapPin, Package } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatusPill from '../../components/ui/StatusPill'
import EmptyState from '../../components/ui/EmptyState'
import { TextSkeleton } from '../../components/ui/Skeleton'
import DeliveryProofModal from '../../components/deliverypartner/DeliveryProofModal'
import DeliveryDetailsModal from '../../components/deliverypartner/DeliveryDetailsModal'
import { bagWeightLb } from '../../utils/stock'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import deliveryPartnerApi from '../../api/deliveryPartnerApi'

// Intentionally the ONLY fields rendered anywhere on this page - no customer
// name/phone/email. The backend already redacts these (DeliveryPartnerOrderResponse
// has no such fields at all), but the frontend doesn't add them back in either.
function OrderCard({ order, onDeliver, onViewDetails }) {
  const isDelivered = order.deliveryStatus === 'Delivered'
  return (
    <div
      className={`card p-4 space-y-3 ${isDelivered ? 'cursor-pointer hover:shadow-cardHover' : ''}`}
      onClick={isDelivered ? () => onViewDetails(order) : undefined}
      role={isDelivered ? 'button' : undefined}
      tabIndex={isDelivered ? 0 : undefined}
      onKeyDown={isDelivered ? (e) => { if (e.key === 'Enter' || e.key === ' ') onViewDetails(order) } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-sm text-primary-700">{order.id}</p>
          {order.deliveryRunNumber && <p className="text-xs text-ink/40 mt-0.5">Run {order.deliveryRunNumber}</p>}
        </div>
        <StatusPill status={order.deliveryStatus} />
      </div>

      <div className="flex items-start gap-2 text-sm">
        <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-ink/70">{order.address || '--'}</p>
      </div>

      <div className="space-y-1.5">
        {(order.items || []).map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <Package className="w-3.5 h-3.5 text-ink/30 shrink-0" aria-hidden="true" />
            <span className="font-semibold truncate">{item.name}</span>
            <span className="text-ink/40 shrink-0">{item.weight ? `${bagWeightLb(item.weight)}lb Bag` : ''} &middot; Qty {item.qty}</span>
          </div>
        ))}
      </div>

      {isDelivered ? (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-leaf-700 pt-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Delivered{order.proofUploaded ? ' - proof uploaded' : ''}
          <span className="text-ink/40 font-normal ml-auto">View details &rarr;</span>
        </div>
      ) : (
        <button onClick={() => onDeliver(order)} className="btn-primary w-full justify-center text-sm">
          <Camera className="w-4 h-4" /> Upload Proof &amp; Mark Delivered
        </button>
      )}
    </div>
  )
}

export default function DeliveryPartnerDeliveries() {
  const { showToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [viewing, setViewing] = useState(null)

  const load = () => {
    deliveryPartnerApi.listOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleConfirm = async ({ file, notes }) => {
    setSubmitting(true)
    try {
      await deliveryPartnerApi.deliver(target.id, { file, notes })
      showToast('Order marked as delivered', 'success')
      setTarget(null)
      load()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to upload delivery proof', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const pending = orders.filter((o) => o.deliveryStatus !== 'Delivered')
  const delivered = orders.filter((o) => o.deliveryStatus === 'Delivered')

  return (
    <div>
      <PageHeader title="My Deliveries" subtitle="Deliveries assigned to you today" />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <TextSkeleton className="h-4 w-1/2" />
              <TextSkeleton className="h-3 w-full" />
              <TextSkeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={Package} title="No deliveries assigned" subtitle="You'll see your assigned orders here once a delivery run is created for you." />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-3">To Deliver ({pending.length})</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pending.map((o) => <OrderCard key={o.id} order={o} onDeliver={setTarget} onViewDetails={setViewing} />)}
              </div>
            </div>
          )}
          {delivered.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-3">Delivered ({delivered.length})</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {delivered.map((o) => <OrderCard key={o.id} order={o} onDeliver={setTarget} onViewDetails={setViewing} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <DeliveryProofModal
        open={!!target}
        onClose={() => setTarget(null)}
        order={target}
        onConfirm={handleConfirm}
        submitting={submitting}
      />
      <DeliveryDetailsModal open={!!viewing} onClose={() => setViewing(null)} order={viewing} />
    </div>
  )
}
