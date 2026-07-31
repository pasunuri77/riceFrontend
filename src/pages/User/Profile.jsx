import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'

const emptyProfile = {
  fullName: '',
  email: '',
  mobile: '',
}

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState(emptyProfile)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      fullName: user?.name || '',
      email: user?.email || '',
      mobile: user?.phone || '',
    })
  }, [user])

  const update = (key) => (e) => {
    const value = key === 'mobile'
      ? e.target.value.replace(/\D/g, '').slice(0, 10)
      : e.target.value
    setForm((current) => ({ ...current, [key]: value }))
  }

  const save = async (e) => {
    e.preventDefault()
    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      showToast('Enter a valid 10-digit Indian mobile number', 'error')
      return
    }

    setSaving(true)
    try {
      await updateProfile(form)
      showToast('Profile updated', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal information" />

      <div className="card p-6 max-w-lg">
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-bold uppercase">{user?.name?.[0]}</div>
            <div>
              <p className="font-bold">{user?.name}</p>
              <p className="text-xs text-ink/40">User Account</p>
            </div>
          </div>
          <div><label className="label-field">Full Name</label><input required value={form.fullName} onChange={update('fullName')} className="input-field" /></div>
          <div><label className="label-field">Email</label><input required value={form.email} onChange={update('email')} type="email" className="input-field" /></div>
          <div><label className="label-field">Mobile Number</label><input required pattern="[6-9][0-9]{9}" maxLength={10} title="Enter a valid 10-digit Indian mobile number" value={form.mobile} onChange={update('mobile')} className="input-field" /></div>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  )
}
