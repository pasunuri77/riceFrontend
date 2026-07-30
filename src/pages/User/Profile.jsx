import { useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })
  const [saving, setSaving] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = (e) => {
    e.preventDefault()
    setSaving(true)
    updateProfile(form)
      .then(() => showToast('Profile updated', 'success'))
      .catch((err) => showToast(err instanceof ApiError ? err.message : 'Failed to update profile', 'error'))
      .finally(() => setSaving(false))
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal information" />

      <div className="card p-6 max-w-lg">
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-bold uppercase">{form.name?.[0]}</div>
            <div>
              <p className="font-bold">{form.name}</p>
              <p className="text-xs text-ink/40">User Account</p>
            </div>
          </div>
          <div><label className="label-field">Full Name</label><input required value={form.name} onChange={update('name')} className="input-field" /></div>
          <div><label className="label-field">Email</label><input required type="email" value={form.email} onChange={update('email')} className="input-field" /></div>
          <div><label className="label-field">Mobile Number</label><input required value={form.phone} onChange={update('phone')} className="input-field" /></div>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  )
}
