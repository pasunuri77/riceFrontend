import { useState } from 'react'
import { INDIAN_STATES } from '../../data/states'

const TYPES = ['Home', 'Office', 'Shop', 'Warehouse', 'Other']

const EMPTY = {
  fullName: '', mobile: '', altMobile: '',
  flat: '', building: '', street: '', area: '', landmark: '', village: '',
  city: '', district: '', state: '', country: 'India', pincode: '',
  type: 'Home', instructions: '', isDefault: false,
}

export default function AddressForm({ initial, onSubmit, onCancel, submitLabel = 'Save Address' }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial })

  const update = (key) => (e) => {
    const val = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
    setForm((f) => ({ ...f, [key]: val }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label-field">Full Name</label>
          <input required className="input-field" value={form.fullName} onChange={update('fullName')} />
        </div>
        <div>
          <label className="label-field">Mobile Number</label>
          <input required pattern="[0-9]{10}" className="input-field" value={form.mobile} onChange={update('mobile')} />
        </div>
        <div>
          <label className="label-field">Alternate Mobile</label>
          <input className="input-field" value={form.altMobile} onChange={update('altMobile')} />
        </div>
      </div>

      <div className="border-t border-black/5 pt-5">
        <p className="font-semibold text-sm text-ink mb-3">Address Details</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label-field">Flat / Door No.</label><input required className="input-field" value={form.flat} onChange={update('flat')} /></div>
          <div><label className="label-field">Building Name</label><input className="input-field" value={form.building} onChange={update('building')} /></div>
          <div><label className="label-field">Street</label><input required className="input-field" value={form.street} onChange={update('street')} /></div>
          <div><label className="label-field">Area</label><input required className="input-field" value={form.area} onChange={update('area')} /></div>
          <div><label className="label-field">Landmark</label><input className="input-field" value={form.landmark} onChange={update('landmark')} /></div>
          <div><label className="label-field">Village (Optional)</label><input className="input-field" value={form.village} onChange={update('village')} /></div>
          <div><label className="label-field">City</label><input required className="input-field" value={form.city} onChange={update('city')} /></div>
          <div><label className="label-field">District</label><input required className="input-field" value={form.district} onChange={update('district')} /></div>
          <div>
            <label className="label-field">State</label>
            <select required className="input-field" value={form.state} onChange={update('state')}>
              <option value="">Select State</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label-field">Country</label><input className="input-field" value={form.country} onChange={update('country')} disabled /></div>
          <div><label className="label-field">Pincode</label><input required pattern="[0-9]{6}" className="input-field" value={form.pincode} onChange={update('pincode')} /></div>
          <div>
            <label className="label-field">Address Type</label>
            <select className="input-field" value={form.type} onChange={update('type')}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="label-field">Delivery Instructions (Optional)</label>
        <textarea rows={2} className="input-field" value={form.instructions} onChange={update('instructions')} placeholder="e.g. Ring the bell twice" />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={form.isDefault} onChange={update('isDefault')} className="accent-primary-500 w-4 h-4" />
        Make this my default address
      </label>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost border border-black/10">Cancel</button>}
      </div>
    </form>
  )
}
