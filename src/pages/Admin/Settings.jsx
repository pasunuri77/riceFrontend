import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import { ApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import settingsApi from '../../api/settingsApi'

const TABS = ['Admin Profile', 'Store Information', 'Delivery & Tax', 'Business Hours']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const emptyProfile = {
  fullName: '',
  email: '',
  mobile: '',
}

const emptySettings = {
  storeName: '',
  gstNumber: '',
  phone: '',
  email: '',
  currency: 'INR',
  deliveryCharge: 0,
  freeDeliveryThreshold: 0,
  taxPercentage: 0,
  businessHours: Object.fromEntries(DAYS.map((d) => [d, { open: '09:00', close: '18:00', closed: false }])),
}

export default function AdminSettings() {
  const [tab, setTab] = useState('Admin Profile')
  const [profile, setProfile] = useState(emptyProfile)
  const [savingProfile, setSavingProfile] = useState(false)
  const { user, updateAdminProfile } = useAuth()
  const { showToast } = useToast()

  // The backend replaces the whole settings record on every save (no partial-field
  // PATCH), so all three tabs share one settings object and every "Save" submits
  // the full thing - not just the fields visible on the current tab.
  const [settings, setSettings] = useState(emptySettings)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    setProfile({
      fullName: user?.name || '',
      email: user?.email || '',
      mobile: user?.phone || '',
    })
  }, [user])

  useEffect(() => {
    settingsApi.get()
      .then((data) => setSettings({ ...emptySettings, ...data, businessHours: { ...emptySettings.businessHours, ...data.businessHours } }))
      .catch(() => showToast('Failed to load store settings', 'error'))
      .finally(() => setLoadingSettings(false))
  }, [])

  const updateProfileField = (key) => (e) => {
    const value = key === 'mobile'
      ? e.target.value.replace(/\D/g, '').slice(0, 10)
      : e.target.value
    setProfile((current) => ({ ...current, [key]: value }))
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    if (!/^[6-9]\d{9}$/.test(profile.mobile)) {
      showToast('Enter a valid 10-digit Indian mobile number', 'error')
      return
    }

    setSavingProfile(true)
    try {
      await updateAdminProfile(profile)
      showToast('Admin profile updated', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update admin profile', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const updateSettingsField = (key) => (e) => {
    setSettings((current) => ({ ...current, [key]: e.target.value }))
  }

  const updateHour = (day, field) => (e) => {
    const value = field === 'closed' ? e.target.checked : e.target.value
    setSettings((current) => ({
      ...current,
      businessHours: { ...current.businessHours, [day]: { ...current.businessHours[day], [field]: value } },
    }))
  }

  const saveSettings = (successMessage) => async (e) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const updated = await settingsApi.update({
        ...settings,
        deliveryCharge: Number(settings.deliveryCharge) || 0,
        freeDeliveryThreshold: Number(settings.freeDeliveryThreshold) || 0,
        taxPercentage: Number(settings.taxPercentage) || 0,
      })
      setSettings({ ...emptySettings, ...updated, businessHours: { ...emptySettings.businessHours, ...updated.businessHours } })
      showToast(successMessage, 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to save settings', 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div>
      <PageHeader title="Store Settings" subtitle="Configure your store preferences" />

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${tab === t ? 'bg-primary-500 text-white' : 'bg-white border border-black/10 text-ink/60'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="card p-6 max-w-2xl">
        {tab === 'Admin Profile' && (
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-bold uppercase">{user?.name?.[0]}</div>
              <div>
                <p className="font-bold">{user?.name}</p>
                <p className="text-xs text-ink/40">Admin Account</p>
              </div>
            </div>
            <div><label className="label-field">Full Name</label><input required value={profile.fullName} onChange={updateProfileField('fullName')} className="input-field" /></div>
            <div><label className="label-field">Email</label><input required value={profile.email} onChange={updateProfileField('email')} type="email" className="input-field" /></div>
            <div><label className="label-field">Mobile Number</label><input required pattern="[6-9][0-9]{9}" maxLength={10} title="Enter a valid 10-digit Indian mobile number" value={profile.mobile} onChange={updateProfileField('mobile')} className="input-field" /></div>
            <button className="btn-primary" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Profile'}</button>
          </form>
        )}

        {tab === 'Store Information' && (
          loadingSettings ? <p className="text-sm text-ink/40">Loading...</p> : (
            <form onSubmit={saveSettings('Store information updated')} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center text-3xl">🌾</div>
                <button type="button" className="btn-outline text-sm">Upload Logo</button>
              </div>
              <div><label className="label-field">Store Name</label><input required value={settings.storeName} onChange={updateSettingsField('storeName')} className="input-field" /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="label-field">GST Number</label><input value={settings.gstNumber} onChange={updateSettingsField('gstNumber')} className="input-field" /></div>
                <div><label className="label-field">Currency</label><input value={`${settings.currency} (₹)`} disabled className="input-field" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="label-field">Phone</label><input value={settings.phone} onChange={updateSettingsField('phone')} className="input-field" /></div>
                <div><label className="label-field">Email</label><input type="email" value={settings.email} onChange={updateSettingsField('email')} className="input-field" /></div>
              </div>
              <button className="btn-primary" disabled={savingSettings}>{savingSettings ? 'Saving...' : 'Save Changes'}</button>
            </form>
          )
        )}

        {tab === 'Delivery & Tax' && (
          loadingSettings ? <p className="text-sm text-ink/40">Loading...</p> : (
            <form onSubmit={saveSettings('Delivery & tax settings updated')} className="space-y-4">
              <div><label className="label-field">Delivery Charges (₹)</label><input type="number" min="0" value={settings.deliveryCharge} onChange={updateSettingsField('deliveryCharge')} className="input-field" /></div>
              <div><label className="label-field">Free Delivery Above (₹)</label><input type="number" min="0" value={settings.freeDeliveryThreshold} onChange={updateSettingsField('freeDeliveryThreshold')} className="input-field" /></div>
              <div><label className="label-field">Tax Percentage (%)</label><input type="number" min="0" value={settings.taxPercentage} onChange={updateSettingsField('taxPercentage')} className="input-field" /></div>
              <button className="btn-primary" disabled={savingSettings}>{savingSettings ? 'Saving...' : 'Save Changes'}</button>
            </form>
          )
        )}

        {tab === 'Business Hours' && (
          loadingSettings ? <p className="text-sm text-ink/40">Loading...</p> : (
            <form onSubmit={saveSettings('Business hours updated')} className="space-y-2">
              {DAYS.map((d) => {
                const hour = settings.businessHours[d] || { open: '', close: '', closed: false }
                return (
                  <div key={d} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                    <span className="text-sm font-medium w-28">{d}</span>
                    <div className="flex items-center gap-2">
                      <input type="time" disabled={hour.closed} value={hour.open} onChange={updateHour(d, 'open')} className="input-field !w-32 py-1.5 disabled:opacity-40" />
                      <span className="text-ink/40 text-xs">to</span>
                      <input type="time" disabled={hour.closed} value={hour.close} onChange={updateHour(d, 'close')} className="input-field !w-32 py-1.5 disabled:opacity-40" />
                      <label className="flex items-center gap-1.5 text-xs text-ink/50 ml-2">
                        <input type="checkbox" checked={!!hour.closed} onChange={updateHour(d, 'closed')} className="accent-primary-500 w-3.5 h-3.5" />
                        Closed
                      </label>
                    </div>
                  </div>
                )
              })}
              <button className="btn-primary mt-4" disabled={savingSettings}>{savingSettings ? 'Saving...' : 'Save Hours'}</button>
            </form>
          )
        )}
      </div>
    </div>
  )
}
