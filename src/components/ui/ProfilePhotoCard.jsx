import { useRef, useState } from 'react'
import { Camera, Trash2, Loader2 } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'

const MAX_FILE_SIZE = 5 * 1024 * 1024

// Avatar + name/role + Change/Remove Photo controls, shared by the user and
// admin profile pages. `onUpload`/`onRemove` do the actual persistence -
// this component only owns the file picker and its own loading state.
export default function ProfilePhotoCard({ name, roleLabel, photoUrl, onUpload, onRemove }) {
  const { showToast } = useToast()
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  const initials = (name || 'U').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const busy = uploading || removing

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Only image files are allowed', 'error'); return }
    if (file.size > MAX_FILE_SIZE) { showToast('Max file size is 5MB', 'error'); return }

    setUploading(true)
    try {
      await onUpload(file)
      showToast('Profile photo updated', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to upload photo', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await onRemove()
      showToast('Profile photo removed', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to remove photo', 'error')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="card p-6">
      <p className="text-xs font-bold uppercase tracking-wider text-ink/40 mb-4">Profile Photo</p>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt={name || 'Profile'} className="w-20 h-20 rounded-full object-cover border-2 border-primary-200" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-leaf-500 flex items-center justify-center text-2xl font-bold text-white uppercase">{initials}</div>
          )}
          {busy && (
            <span className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </span>
          )}
        </div>
        <div>
          <p className="font-bold text-sm">{name}</p>
          {roleLabel ? <p className="text-xs text-ink/40 mb-3">{roleLabel}</p> : <div className="mb-3" />}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-50 border border-primary-200 text-primary-700 hover:bg-primary-100 transition disabled:opacity-40"
            >
              <Camera className="w-3.5 h-3.5" /> Change Photo
            </button>
            {photoUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Photo
              </button>
            )}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  )
}
