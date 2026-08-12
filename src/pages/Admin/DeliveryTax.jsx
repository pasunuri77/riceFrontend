import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import { ApiError } from '../../api/client'
import settingsApi from '../../api/settingsApi'
import deliveryApi from '../../api/deliveryApi'
import { useToast } from '../../context/ToastContext'

const defaultSettings = {
  deliveryCharge: 0,
  freeDeliveryThreshold: 0,
  taxPercentage: 0,
}

export default function AdminDeliveryTax() {
  const [settings, setSettings] = useState(null)
  const [full, setFull] = useState(null) // full settings object, so saving doesn't drop fields this page doesn't own
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pincodes, setPincodes] = useState([])
  const [pincodesLoading, setPincodesLoading] = useState(true)
  const [newPincode, setNewPincode] = useState('')
  const [addingPincode, setAddingPincode] = useState(false)
  const { showToast } = useToast()

  const loadPincodes = () => deliveryApi.admin.list()
    .then(setPincodes)
    .catch((err) => showToast(err instanceof ApiError ? err.message : 'Failed to load serviceable pincodes', 'error'))
    .finally(() => setPincodesLoading(false))

  useEffect(() => {
    settingsApi.getAdmin()
      .then((data) => {
        setFull(data)
        setSettings({
          deliveryCharge: Number(data?.deliveryCharge ?? defaultSettings.deliveryCharge),
          freeDeliveryThreshold: Number(data?.freeDeliveryThreshold ?? defaultSettings.freeDeliveryThreshold),
          taxPercentage: Number(data?.taxPercentage ?? defaultSettings.taxPercentage),
        })
      })
      .catch((err) => showToast(err instanceof ApiError ? err.message : 'Failed to load delivery & tax settings', 'error'))
      .finally(() => setLoading(false))
    loadPincodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast])

  const addPincode = async (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(newPincode)) {
      showToast('Enter a valid 6-digit pincode', 'error')
      return
    }
    setAddingPincode(true)
    try {
      const added = await deliveryApi.admin.add([newPincode])
      if (added.length === 0) showToast('That pincode is already in the list', 'error')
      else {
        setPincodes((prev) => [...prev, ...added])
        setNewPincode('')
        showToast('Pincode added', 'success')
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to add pincode', 'error')
    } finally {
      setAddingPincode(false)
    }
  }

  const removePincode = async (pincode) => {
    const prev = pincodes
    setPincodes((current) => current.filter((p) => p !== pincode))
    try {
      await deliveryApi.admin.remove(pincode)
      showToast('Pincode removed', 'success')
    } catch (err) {
      setPincodes(prev)
      showToast(err instanceof ApiError ? err.message : 'Failed to remove pincode', 'error')
    }
  }

  const updateField = (key) => (e) => {
    setSettings((current) => ({ ...current, [key]: Number(e.target.value) }))
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await settingsApi.update({ ...full, ...settings })
      setFull(updated)
      setSettings({
        deliveryCharge: Number(updated.deliveryCharge ?? 0),
        freeDeliveryThreshold: Number(updated.freeDeliveryThreshold ?? 0),
        taxPercentage: Number(updated.taxPercentage ?? 0),
      })
      window.dispatchEvent(new Event('store-settings:saved'))
      showToast('Delivery & tax settings saved', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to save delivery & tax settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Delivery & Tax' }]} />
      <PageHeader title="Delivery & Tax" subtitle="Configure delivery charges and tax rate" />

      <div className="card p-6 max-w-2xl">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label-field">Delivery Charges (₹)</label>
            <input min="0" type="number" value={settings?.deliveryCharge ?? ''} onChange={updateField('deliveryCharge')} placeholder="0" className="input-field" disabled={loading} />
          </div>
          <div>
            <label className="label-field">Free Delivery Above (₹)</label>
            <input min="0" type="number" value={settings?.freeDeliveryThreshold ?? ''} onChange={updateField('freeDeliveryThreshold')} placeholder="0" className="input-field" disabled={loading} />
          </div>
          <div>
            <label className="label-field">Tax Percentage (%)</label>
            <input min="0" type="number" value={settings?.taxPercentage ?? ''} onChange={updateField('taxPercentage')} placeholder="0" className="input-field" disabled={loading} />
          </div>
          <button className="btn-primary" disabled={saving || loading}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>

      <div className="card p-6 max-w-2xl mt-6">
        <h3 className="font-bold text-lg font-display mb-1">Serviceable Pincodes</h3>
        <p className="text-sm text-ink/50 mb-4">Only pincodes listed here pass the delivery-availability check customers see when adding an address.</p>

        <form onSubmit={addPincode} className="flex gap-2 mb-4">
          <input
            value={newPincode}
            onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit pincode"
            className="input-field !w-40"
          />
          <button type="submit" disabled={addingPincode} className="btn-primary text-sm disabled:opacity-60">
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        {pincodesLoading ? (
          <p className="text-sm text-ink/40">Loading...</p>
        ) : pincodes.length === 0 ? (
          <p className="text-sm text-ink/40">No pincodes added yet - every delivery-availability check will report "not serviceable" until at least one exists.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pincodes.map((p) => (
              <span key={p} className="badge bg-black/5 text-ink/70 flex items-center gap-1.5">
                {p}
                <button type="button" onClick={() => removePincode(p)} aria-label={`Remove pincode ${p}`} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
