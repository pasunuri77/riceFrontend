import { useState } from 'react'
import { Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import deliveryApi from '../../api/deliveryApi'

export default function DeliveryAddressModal({ open, onClose, addresses, selected, onSelect, onEdit, onDelete, onAddNew }) {
  const [pincode, setPincode] = useState('')
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)

  const runCheck = () => {
    if (!/^\d{6}$/.test(pincode)) {
      setResult({ ok: false, message: 'Enter a valid 6-digit pincode' })
      return
    }
    setChecking(true)
    deliveryApi.check(pincode)
      .then((res) => setResult({ ok: res.serviceable, message: res.serviceable ? `Delivering to ${pincode}` : `Not deliverable to ${pincode} yet` }))
      .catch(() => setResult({ ok: false, message: 'Unable to check delivery right now' }))
      .finally(() => setChecking(false))
  }

  return (
    <Modal open={open} onClose={onClose} title="Select Delivery Address" maxWidth="max-w-md">
      <div className="-mx-6 -mt-6 px-6 pt-5 pb-4 border-b border-black/5">
        <div className="flex gap-2">
          <input
            value={pincode}
            onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setResult(null) }}
            placeholder="Enter Pincode"
            inputMode="numeric"
            aria-label="Enter pincode to check delivery"
            className="input-field flex-1"
          />
          <button onClick={runCheck} disabled={!pincode || checking} className="btn-outline px-4 text-sm font-bold shrink-0 disabled:opacity-40">
            {checking ? 'Checking...' : 'Check'}
          </button>
        </div>
        {result && (
          <p className={`flex items-center gap-1.5 text-xs font-semibold mt-2 ${result.ok ? 'text-leaf-600' : 'text-red-500'}`}>
            {result.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> : <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
            {result.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 pb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-ink/40">Saved Address</p>
        <button onClick={onAddNew} className="text-xs font-bold text-primary-600 hover:underline">+ Add New Address</button>
      </div>

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

      <button onClick={onAddNew} className="btn-outline w-full mt-4"><Plus className="w-4 h-4" aria-hidden="true" /> Add New Address</button>
    </Modal>
  )
}
