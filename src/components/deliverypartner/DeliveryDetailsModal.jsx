import { useEffect, useState } from 'react'
import { CheckCircle2, MapPin, Package, ZoomIn } from 'lucide-react'
import Modal from '../ui/Modal'
import ImageLightbox from '../ui/ImageLightbox'
import { bagWeightLb } from '../../utils/stock'
import deliveryPartnerApi from '../../api/deliveryPartnerApi'

// Read-only view of an already-delivered order - the photo/notes/timestamp
// captured at delivery time, for a partner to double-check what they
// submitted. Distinct from DeliveryProofModal, which is the upload flow for
// an order that hasn't been delivered yet.
export default function DeliveryDetailsModal({ open, onClose, order }) {
  const [proof, setProof] = useState(null)
  const [loading, setLoading] = useState(false)
  const [available, setAvailable] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!open || !order) return
    setProof(null)
    setAvailable(true)
    setLoading(true)
    deliveryPartnerApi.getOrderProof(order.id)
      .then(setProof)
      .catch(() => setAvailable(false))
      .finally(() => setLoading(false))
  }, [open, order?.id])

  if (!order) return null

  return (
    <Modal open={open} onClose={onClose} title="Delivery Details">
      <div className="space-y-4">
        <div className="card p-3.5 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-ink/50">Order</span><span className="font-semibold">{order.id}</span></div>
          {order.deliveryRunNumber && <div className="flex justify-between"><span className="text-ink/50">Run</span><span className="font-semibold">{order.deliveryRunNumber}</span></div>}
          <div className="flex justify-between items-start gap-3"><span className="text-ink/50 shrink-0 flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</span><span className="font-semibold text-right">{order.address || '--'}</span></div>
        </div>

        <div>
          <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Items</h5>
          <div className="card divide-y divide-black/5">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between gap-3">
                <span className="font-semibold truncate">{item.name}</span>
                <span className="text-ink/40 text-sm shrink-0">{item.weight ? `${bagWeightLb(item.weight)}lb Bag` : ''} &middot; Qty {item.qty}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-leaf-600" /> Delivery Proof</h5>
          {loading ? (
            <p className="text-sm text-ink/40">Loading...</p>
          ) : !available ? (
            <p className="text-sm text-ink/40">Proof details aren't available to view yet - the photo was uploaded successfully when this order was marked delivered.</p>
          ) : proof ? (
            <div className="card p-3.5 space-y-3">
              {proof.imageUrl && (
                <button type="button" onClick={() => setLightboxOpen(true)} className="relative w-full group rounded-xl overflow-hidden" aria-label="View full delivery proof photo">
                  <img src={proof.imageUrl} alt="Delivery proof" className="w-full max-h-72 object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              )}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-ink/50">Delivered At</span><span className="font-semibold">{proof.deliveredAt ? new Date(proof.deliveredAt).toLocaleString() : '--'}</span></div>
                {proof.notes && <div className="flex justify-between gap-3"><span className="text-ink/50 shrink-0">Notes</span><span className="font-semibold text-right">{proof.notes}</span></div>}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <ImageLightbox open={lightboxOpen} onClose={() => setLightboxOpen(false)} src={proof?.imageUrl} alt="Delivery proof" downloadName={`delivery-proof-${order?.id || 'order'}.jpg`} />
    </Modal>
  )
}
