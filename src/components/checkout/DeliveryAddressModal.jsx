import { Plus, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'

export default function DeliveryAddressModal({ open, onClose, addresses, selected, onSelect, onEdit, onDelete, onAddNew }) {
  return (
    <Modal open={open} onClose={onClose} title="Select Delivery Address" maxWidth="max-w-md">
      <button onClick={onAddNew} className="btn-outline w-full mb-4"><Plus className="w-4 h-4" aria-hidden="true" /> Add New Address</button>

      <p className="text-xs font-bold uppercase tracking-wide text-ink/40 pb-3">Saved Address</p>

      {addresses.length === 0 ? (
        <p className="text-sm text-ink/50 text-center py-6">No saved addresses yet.</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto -mx-1 px-1">
          {addresses.map((a) => {
            const isSelected = selected === a.id
            return (
              <div key={a.id} className={`card p-4 transition ${isSelected ? 'ring-2 ring-primary-500' : ''}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onSelect(a.id)}
                    aria-label={`Deliver to ${a.fullName}'s address`}
                    aria-pressed={isSelected}
                    className="mt-1 shrink-0"
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary-500' : 'border-black/20'}`}>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                    </span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm">{a.fullName}</p>
                      <span className="badge border border-primary-200 bg-primary-50 text-primary-600 text-[10px] shrink-0">{a.type}</span>
                    </div>
                    <p className="text-sm text-ink/60 mt-1 leading-relaxed">
                      {[a.flat, a.building, a.street, a.area, a.landmark].filter(Boolean).join(', ')}
                      <br />
                      {[a.city, a.district, a.state].filter(Boolean).join(', ')} - {a.pincode}
                    </p>
                    <p className="text-xs text-ink/50 mt-1.5">Mobile: <span className="font-bold text-ink/70">{a.mobile}</span></p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onSelect(a.id)}
                        className={`btn text-xs px-3 py-1.5 flex-1 justify-center ${isSelected ? 'bg-ink text-white' : 'bg-black/5 text-ink/70'}`}
                      >
                        {isSelected ? 'Delivering Here' : 'Deliver Here'}
                      </button>
                      <button onClick={() => onEdit(a)} className="btn text-xs px-3 py-1.5 bg-white border border-black/10 text-ink/70">Edit</button>
                      <button onClick={() => onDelete(a.id)} aria-label={`Delete ${a.fullName}'s address`} className="btn px-2.5 py-1.5 bg-white border border-black/10 text-red-500 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
