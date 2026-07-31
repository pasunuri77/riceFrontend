import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import { ApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const TABS = ['Admin Profile', 'Store Information', 'Delivery & Tax', 'Business Hours']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const emptyProfile = {
  fullName: '',
  email: '',
  mobile: '',
}

export default function AdminSettings() {
  const [tab, setTab] = useState('Admin Profile')
  const [profile, setProfile] = useState(emptyProfile)
  const [savingProfile, setSavingProfile] = useState(false)
  const { user, updateAdminProfile } = useAuth()
  const { showToast } = useToast()
  const save = (e) => { e.preventDefault(); showToast('Settings saved', 'success') }

  useEffect(() => {
    setProfile({
      fullName: user?.name || '',
      email: user?.email || '',
      mobile: user?.phone || '',
    })
  }, [user])

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
          <form onSubmit={save} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center text-3xl">🌾</div>
              <button type="button" className="btn-outline text-sm">Upload Logo</button>
            </div>
            <div><label className="label-field">Store Name</label><input defaultValue="RiceBazaar" className="input-field" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label-field">GST Number</label><input defaultValue="07AAECR1234F1Z8" className="input-field" /></div>
              <div><label className="label-field">Currency</label><input defaultValue="INR (₹)" disabled className="input-field" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label-field">Phone</label><input defaultValue="+91 98765 43210" className="input-field" /></div>
              <div><label className="label-field">Email</label><input defaultValue="support@ricebazaar.in" className="input-field" /></div>
            </div>
            <button className="btn-primary">Save Changes</button>
          </form>
        )}

        {tab === 'Delivery & Tax' && (
          <form onSubmit={save} className="space-y-4">
            <div><label className="label-field">Delivery Charges (₹)</label><input type="number" defaultValue={49} className="input-field" /></div>
            <div><label className="label-field">Free Delivery Above (₹)</label><input type="number" defaultValue={999} className="input-field" /></div>
            <div><label className="label-field">Tax Percentage (%)</label><input type="number" defaultValue={5} className="input-field" /></div>
            <button className="btn-primary">Save Changes</button>
          </form>
        )}

        {tab === 'Business Hours' && (
          <form onSubmit={save} className="space-y-2">
            {DAYS.map((d) => (
              <div key={d} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                <span className="text-sm font-medium w-28">{d}</span>
                <div className="flex items-center gap-2">
                  <input type="time" defaultValue="09:00" className="input-field !w-32 py-1.5" />
                  <span className="text-ink/40 text-xs">to</span>
                  <input type="time" defaultValue="19:00" className="input-field !w-32 py-1.5" />
                </div>
              </div>
            ))}
            <button className="btn-primary mt-4">Save Hours</button>
          </form>
        )}
      </div>
    </div>
  )
}
