import { useEffect, useState } from 'react'
import { Camera, CheckCircle2, X } from 'lucide-react'
import Modal from '../ui/Modal'

const MAX_PHOTO_MB = 8

// A delivery-proof photo is required, not optional - "Mark Delivered" simply
// doesn't exist as a separate action; the only way an order becomes Delivered
// is by successfully uploading this photo (see deliveryPartnerApi.deliver,
// which does both in one call).
export default function DeliveryProofModal({ open, onClose, order, onConfirm, submitting }) {
  const [photo, setPhoto] = useState(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) { setPhoto(null); setNotes('') }
  }, [open, order?.id])

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url) }, [photo])

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const pickFile = (fileList) => {
    const file = fileList?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) return
    if (photo) URL.revokeObjectURL(photo.url)
    setPhoto({ file, url: URL.createObjectURL(file) })
  }

  const submit = () => {
    if (!photo) return
    onConfirm({ file: photo.file, notes: notes.trim() })
  }

  if (!order) return null

  return (
    <Modal open={open} onClose={handleClose} title="Delivery Proof">
      <div className="space-y-4">
        <div className="card p-3.5 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-ink/50">Order</span><span className="font-semibold">{order.id}</span></div>
          <div className="flex justify-between items-start gap-3"><span className="text-ink/50 shrink-0">Address</span><span className="font-semibold text-right">{order.address || '--'}</span></div>
        </div>

        <div>
          <p className="label-field">Delivery Proof Photo</p>
          {photo ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-black/10">
              <img src={photo.url} alt="Delivery proof preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { URL.revokeObjectURL(photo.url); setPhoto(null) }}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1.5"
                aria-label="Remove photo"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <label className="w-full h-48 rounded-xl border-2 border-dashed border-black/15 flex flex-col items-center justify-center text-ink/40 cursor-pointer hover:border-primary-300 hover:text-primary-500">
              <Camera className="w-6 h-6" />
              <span className="text-sm font-semibold mt-2">Take or upload a photo</span>
              <span className="text-xs mt-0.5">Show the package at the doorstep</span>
              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => pickFile(e.target.files)} />
            </label>
          )}
          <p className="text-xs text-ink/40 mt-1.5">Required before this order can be marked Delivered.</p>
        </div>

        <div>
          <label className="label-field" htmlFor="delivery-notes">Notes (Optional)</label>
          <textarea id="delivery-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="E.g. Left at the front door..." className="input-field resize-none" />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={handleClose} disabled={submitting} className="btn-outline flex-1 justify-center disabled:opacity-60">Cancel</button>
          <button type="button" onClick={submit} disabled={submitting || !photo} className="btn-primary flex-1 justify-center disabled:opacity-60">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {submitting ? 'Uploading...' : 'Mark Delivered'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
