import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'
import { ApiError } from '../../api/client'
import settingsApi from '../../api/settingsApi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { INDIAN_MOBILE_REGEX, sanitizeMobileInput } from '../../utils/phone'

const TABS = ['Admin Profile', 'Store Information']

const defaultSettings = {
  storeName: 'RiceBazaar',
  gstNumber: '',
  phone: '',
  email: '',
  currency: 'INR',
  logo: '',
}

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  mobile: z.string().regex(INDIAN_MOBILE_REGEX, 'Enter a valid 10-digit Indian mobile number'),
})

export default function AdminSettings() {
  const [tab, setTab] = useState('Admin Profile')
  const [settings, setSettings] = useState(defaultSettings)
  const [full, setFull] = useState(null) // full settings object, so saving here doesn't drop fields this page doesn't own (delivery/tax)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef(null)
  const { user, updateAdminProfile } = useAuth()
  const { showToast } = useToast()

  const handleLogoFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setUploadingLogo(true)
    settingsApi.uploadLogo(file)
      .then((res) => setSettings((current) => ({ ...current, logo: res.url })))
      .catch((err) => showToast(err instanceof ApiError ? err.message : 'Logo upload failed', 'error'))
      .finally(() => setUploadingLogo(false))
  }

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

  const { onChange: onMobileChange, ...mobileField } = registerProfile('mobile')

  useEffect(() => {
    resetProfile({
      fullName: user?.name || '',
      email: user?.email || '',
      mobile: user?.phone || '',
    })
  }, [user, resetProfile])

  useEffect(() => {
    settingsApi.getAdmin()
      .then((data) => {
        setFull(data)
        setSettings({ ...defaultSettings, ...data })
      })
      .catch((err) => showToast(err instanceof ApiError ? err.message : 'Failed to load store settings', 'error'))
      .finally(() => setLoadingSettings(false))
  }, [showToast])

  const updateSettingsField = (key) => (e) => {
    setSettings((current) => ({ ...current, [key]: e.target.value }))
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
      const updated = await settingsApi.update({ ...full, ...settings })
      setFull(updated)
      setSettings({ ...defaultSettings, ...updated })
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
              <input
                {...mobileField}
                onChange={(e) => sanitizeMobileInput(e, onMobileChange)}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="input-field"
                aria-invalid={!!profileErrors.mobile}
              />
            </FormField>
            <SubmitButton loading={savingProfile} className="btn-primary">Save Profile</SubmitButton>
          </form>
        )}

        {tab === 'Store Information' && (
          <form onSubmit={saveSettings} className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                aria-label="Change store logo"
                className="w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center text-xl font-bold text-primary-600 overflow-hidden shrink-0 hover:opacity-80 transition relative"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : settings.logo ? (
                  <img src={settings.logo} alt="Store logo" className="w-full h-full object-cover" />
                ) : (
                  'RB'
                )}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoFile(e.target.files?.[0])}
              />
              <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="btn-outline text-sm disabled:opacity-60">
                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              </button>
              {settings.logo && (
                <button type="button" onClick={() => setSettings((current) => ({ ...current, logo: '' }))} disabled={uploadingLogo} className="btn-outline text-sm disabled:opacity-60">
                  Remove Logo
                </button>
              )}
            </div>
            <div><label className="label-field">Store Name</label><input required value={settings.storeName} onChange={updateSettingsField('storeName')} placeholder="RiceBazaar" className="input-field" disabled={loadingSettings} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label-field">GST Number</label><input value={settings.gstNumber} onChange={updateSettingsField('gstNumber')} placeholder="Enter GST number" className="input-field" disabled={loadingSettings} /></div>
              <div><label className="label-field">Currency</label><input value={settings.currency} disabled className="input-field" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Phone</label>
                <input
                  value={settings.phone}
                  onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); updateSettingsField('phone')(e) }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter support phone"
                  className="input-field"
                  disabled={loadingSettings}
                />
              </div>
              <div><label className="label-field">Email</label><input value={settings.email} onChange={updateSettingsField('email')} placeholder="Enter support email" type="email" className="input-field" disabled={loadingSettings} /></div>
            </div>
            <button className="btn-primary" disabled={savingSettings || loadingSettings}>{savingSettings ? 'Saving...' : 'Save Changes'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
