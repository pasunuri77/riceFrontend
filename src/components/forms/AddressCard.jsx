import { Home, Building2, Star, Pencil, Trash2, MapPin } from 'lucide-react'

const ICONS = { Home, Office: Building2, Shop: Building2, Warehouse: Building2, Other: MapPin }

export default function AddressCard({ address, onEdit, onDelete, onSetDefault, onSelect, selected }) {
  const Icon = ICONS[address.type] || MapPin
  const name = address.fullName

  return (
    <div className={`card p-4 relative ${selected ? 'ring-2 ring-primary-500' : ''}`}>
      {address.isDefault && (
        <span className="badge bg-primary-500 text-white absolute top-3 right-3">Default</span>
      )}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <span className="badge bg-black/5 text-ink/60">{address.type}</span>
        </div>
      </div>
      <p className="text-sm text-ink/60 leading-relaxed">
        {[address.flat, address.building, address.street, address.area, address.landmark].filter(Boolean).join(', ')}
        <br />
        {[address.city, address.district, address.state, address.pincode].filter(Boolean).join(', ')}
      </p>
      <p className="text-sm text-ink/50 mt-1.5">📞 {address.mobile}</p>

      <div className="flex flex-wrap gap-2 mt-3.5 pt-3.5 border-t border-black/5">
        {onSelect && (
          <button onClick={() => onSelect(address)} className={`btn text-xs px-3 py-1.5 ${selected ? 'bg-primary-500 text-white' : 'bg-primary-50 text-primary-700'}`}>
            {selected ? 'Deliver Here ✓' : 'Deliver Here'}
          </button>
        )}
        {onEdit && (
          <button onClick={() => onEdit(address)} className="btn text-xs px-3 py-1.5 bg-black/5 text-ink/70"><Pencil className="w-3 h-3" /> Edit</button>
        )}
        {onSetDefault && !address.isDefault && (
          <button onClick={() => onSetDefault(address.id)} className="btn text-xs px-3 py-1.5 bg-black/5 text-ink/70"><Star className="w-3 h-3" /> Set Default</button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(address.id)} className="btn text-xs px-3 py-1.5 bg-red-50 text-red-500"><Trash2 className="w-3 h-3" /> Delete</button>
        )}
      </div>
    </div>
  )
}
