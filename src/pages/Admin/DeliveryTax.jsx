import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import { ApiError } from '../../api/client'
import settingsApi from '../../api/settingsApi'
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
  const { showToast } = useToast()

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
  }, [showToast])

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
    </div>
  )
}
