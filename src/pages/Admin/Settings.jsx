import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'
import { ApiError } from '../../api/client'
import settingsApi from '../../api/settingsApi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const TABS = ['Admin Profile', 'Store Information', 'Delivery & Tax', 'Business Hours']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
})

const defaultSettings = {
  storeName: 'RiceBazaar',
  gstNumber: '',
  phone: '',
  email: '',
  currency: 'INR',
  deliveryCharge: 0,
  freeDeliveryThreshold: 0,
  taxPercentage: 0,
  businessHours: DAYS.reduce((hours, day) => ({
    ...hours,
    [day]: { open: '09:00', close: '18:00', closed: false },
  }), {}),
}

function normalizeSettings(data) {
  return {
    ...defaultSettings,
    ...data,
    deliveryCharge: Number(data?.deliveryCharge ?? defaultSettings.deliveryCharge),
    freeDeliveryThreshold: Number(data?.freeDeliveryThreshold ?? defaultSettings.freeDeliveryThreshold),
    taxPercentage: Number(data?.taxPercentage ?? defaultSettings.taxPercentage),
    businessHours: {
      ...defaultSettings.businessHours,
      ...(data?.businessHours || {}),
    },
  }
}

export default function AdminSettings() {
  const [tab, setTab] = useState('Admin Profile')
  const [settings, setSettings] = useState(defaultSettings)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const { user, updateAdminProfile } = useAuth()
  const { showToast } = useToast()

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: savingProfile },
  } = useForm({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: { fullName: '', email: '', mobile: '' },
  })

  useEffect(() => {
    resetProfile({
      fullName: user?.name || '',
      email: user?.email || '',
      mobile: user?.phone || '',
    })
  }, [user, resetProfile])

  useEffect(() => {
    settingsApi.get()
      .then((data) => setSettings(normalizeSettings(data)))
      .catch((err) => showToast(err instanceof ApiError ? err.message : 'Failed to load store settings', 'error'))
      .finally(() => setLoadingSettings(false))
  }, [showToast])

  const updateSettingsField = (key) => (e) => {
    const numericFields = ['deliveryCharge', 'freeDeliveryThreshold', 'taxPercentage']
    const value = numericFields.includes(key) ? Number(e.target.value) : e.target.value
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const updateBusinessHour = (day, key) => (e) => {
    const value = key === 'closed' ? e.target.checked : e.target.value
    setSettings((current) => ({
      ...current,
      businessHours: {
        ...current.businessHours,
        [day]: {
          ...current.businessHours[day],
          [key]: value,
        },
      },
    }))
  }

  const saveProfile = async (data) => {
    try {
      await updateAdminProfile(data)
      showToast('Admin profile updated', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update admin profile', 'error')
    }
  }

  const saveSettings = async (e) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const updated = await settingsApi.update(settings)
      setSettings(normalizeSettings(updated))
      showToast('Store settings saved', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to save store settings', 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Settings' }]} />
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
          <form onSubmit={handleProfileSubmit(saveProfile)} className="space-y-4" noValidate>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-bold uppercase">{user?.name?.[0]}</div>
              <div>
                <p className="font-bold">{user?.name}</p>
                <p className="text-xs text-ink/40">Admin Account</p>
              </div>
            </div>
            <FormField label="Full Name" error={profileErrors.fullName?.message}>
              <input {...registerProfile('fullName')} autoFocus className="input-field" aria-invalid={!!profileErrors.fullName} />
            </FormField>
            <FormField label="Email" error={profileErrors.email?.message}>
              <input {...registerProfile('email')} type="email" className="input-field" aria-invalid={!!profileErrors.email} />
            </FormField>
            <FormField label="Mobile Number" error={profileErrors.mobile?.message}>
              <input {...registerProfile('mobile')} inputMode="numeric" maxLength={10} className="input-field" aria-invalid={!!profileErrors.mobile} />
            </FormField>
            <SubmitButton loading={savingProfile} className="btn-primary">Save Profile</SubmitButton>
          </form>
        )}

        {tab === 'Store Information' && (
          <form onSubmit={saveSettings} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center text-xl font-bold text-primary-600">RB</div>
              <button type="button" className="btn-outline text-sm">Upload Logo</button>
            </div>
            <div><label className="label-field">Store Name</label><input required value={settings.storeName} onChange={updateSettingsField('storeName')} placeholder="RiceBazaar" className="input-field" disabled={loadingSettings} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label-field">GST Number</label><input value={settings.gstNumber} onChange={updateSettingsField('gstNumber')} placeholder="Enter GST number" className="input-field" disabled={loadingSettings} /></div>
              <div><label className="label-field">Currency</label><input value={settings.currency} disabled className="input-field" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label-field">Phone</label><input value={settings.phone} onChange={updateSettingsField('phone')} placeholder="Enter support phone" className="input-field" disabled={loadingSettings} /></div>
              <div><label className="label-field">Email</label><input value={settings.email} onChange={updateSettingsField('email')} placeholder="Enter support email" type="email" className="input-field" disabled={loadingSettings} /></div>
            </div>
            <button className="btn-primary" disabled={savingSettings || loadingSettings}>{savingSettings ? 'Saving...' : 'Save Changes'}</button>
          </form>
        )}

        {tab === 'Delivery & Tax' && (
          <form onSubmit={saveSettings} className="space-y-4">
            <div><label className="label-field">Delivery Charges (₹)</label><input min="0" type="number" value={settings.deliveryCharge} onChange={updateSettingsField('deliveryCharge')} placeholder="0" className="input-field" disabled={loadingSettings} /></div>
            <div><label className="label-field">Free Delivery Above (₹)</label><input min="0" type="number" value={settings.freeDeliveryThreshold} onChange={updateSettingsField('freeDeliveryThreshold')} placeholder="0" className="input-field" disabled={loadingSettings} /></div>
            <div><label className="label-field">Tax Percentage (%)</label><input min="0" type="number" value={settings.taxPercentage} onChange={updateSettingsField('taxPercentage')} placeholder="0" className="input-field" disabled={loadingSettings} /></div>
            <button className="btn-primary" disabled={savingSettings || loadingSettings}>{savingSettings ? 'Saving...' : 'Save Changes'}</button>
          </form>
        )}

        {tab === 'Business Hours' && (
          <form onSubmit={saveSettings} className="space-y-2">
            {DAYS.map((d) => {
              const hours = settings.businessHours[d] || defaultSettings.businessHours[d]
              return (
                <div key={d} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 border-b border-black/5 last:border-0">
                  <span className="text-sm font-medium w-28">{d}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-ink/60">
                      <input type="checkbox" checked={Boolean(hours.closed)} onChange={updateBusinessHour(d, 'closed')} disabled={loadingSettings} />
                      Closed
                    </label>
                    <input type="time" value={hours.open || ''} onChange={updateBusinessHour(d, 'open')} className="input-field !w-32 py-1.5" disabled={loadingSettings || hours.closed} />
                    <span className="text-ink/40 text-xs">to</span>
                    <input type="time" value={hours.close || ''} onChange={updateBusinessHour(d, 'close')} className="input-field !w-32 py-1.5" disabled={loadingSettings || hours.closed} />
                  </div>
                </div>
              )
            })}
            <button className="btn-primary mt-4" disabled={savingSettings || loadingSettings}>{savingSettings ? 'Saving...' : 'Save Hours'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
