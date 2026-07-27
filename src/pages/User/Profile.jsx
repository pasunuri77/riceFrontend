import PageHeader from '../../components/ui/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function Profile() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const save = (e) => { e.preventDefault(); showToast('Profile updated', 'success') }

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
          <div><label className="label-field">Full Name</label><input defaultValue={user?.name} className="input-field" /></div>
          <div><label className="label-field">Email</label><input defaultValue={user?.email} type="email" className="input-field" /></div>
          <div><label className="label-field">Mobile Number</label><input defaultValue={user?.phone} className="input-field" /></div>
          <button className="btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  )
}
