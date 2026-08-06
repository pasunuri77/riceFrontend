import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Image as ImageIcon, Info } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'
import EmptyState from '../../components/ui/EmptyState'
import ImageDropzone from '../../components/ui/ImageDropzone'
import { safeImageUrl } from '../../utils/sanitize'
import { useToast } from '../../context/ToastContext'

const STORAGE_KEY = 'rb_admin_banners_preview'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  linkTo: z.string().optional(),
  image: z.string().optional(),
  active: z.boolean(),
})

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

export default function AdminBanners() {
  const [banners, setBanners] = useState(load)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { showToast } = useToast()

  useEffect(() => persist(banners), [banners])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { title: '', subtitle: '', linkTo: '', image: '', active: true },
  })

  const image = watch('image')

  const openAdd = () => { setEditing(null); reset({ title: '', subtitle: '', linkTo: '', image: '', active: true }); setModalOpen(true) }
  const openEdit = (b) => { setEditing(b); reset(b); setModalOpen(true) }

  const onSubmit = async (data) => {
    if (editing) {
      setBanners((prev) => prev.map((b) => (b.id === editing.id ? { ...data, id: editing.id } : b)))
      showToast('Banner updated (preview only)', 'success')
    } else {
      setBanners((prev) => [{ ...data, id: crypto.randomUUID() }, ...prev])
      showToast('Banner added (preview only)', 'success')
    }
    setModalOpen(false)
  }

  const confirmRemove = () => {
    setBanners((prev) => prev.filter((b) => b.id !== confirmDelete.id))
    showToast('Banner removed', 'success')
    setConfirmDelete(null)
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Banners' }]} />
      <PageHeader
        title="Banner Management"
        subtitle="Manage homepage promotional banners"
        action={<button onClick={openAdd} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add Banner</button>}
      />

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 mb-6">
        <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <p>Preview only - there's no banner endpoint on the backend yet, so banners created here are saved locally in this browser and won't actually appear on the live homepage. Wire this up once a real banner API exists.</p>
      </div>

      {banners.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No banners yet" subtitle="Create your first promotional banner to see it here." actionLabel="Add Banner" onAction={openAdd} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((b) => (
            <div key={b.id} className="card overflow-hidden">
              <div className="aspect-[16/7] bg-primary-50 flex items-center justify-center">
                {safeImageUrl(b.image) ? (
                  <img src={safeImageUrl(b.image)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-primary-300" aria-hidden="true" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-bold text-sm truncate">{b.title}</p>
                  <span className={`badge shrink-0 ${b.active ? 'bg-leaf-100 text-leaf-700' : 'bg-black/10 text-ink/50'}`}>{b.active ? 'Active' : 'Inactive'}</span>
                </div>
                {b.subtitle && <p className="text-xs text-ink/50 line-clamp-2">{b.subtitle}</p>}
                <div className="flex gap-1.5 mt-3">
                  <button onClick={() => openEdit(b)} className="btn text-xs px-3 py-1.5 bg-black/5 text-ink/70 flex-1 justify-center"><Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Edit</button>
                  <button onClick={() => setConfirmDelete(b)} className="btn text-xs px-3 py-1.5 bg-red-50 text-red-500 flex-1 justify-center"><Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Banner' : 'Add Banner'} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Title" error={errors.title?.message}>
            <input {...register('title')} autoFocus className="input-field" aria-invalid={!!errors.title} />
          </FormField>
          <FormField label="Subtitle (Optional)">
            <input {...register('subtitle')} className="input-field" />
          </FormField>
          <FormField label="Link To (Optional)" hint="e.g. /products?category=Basmati">
            <input {...register('linkTo')} className="input-field" placeholder="/products" />
          </FormField>
          <FormField label="Banner Image">
            <ImageDropzone value={image} onChange={(url) => setValue('image', url, { shouldValidate: true })} />
          </FormField>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register('active')} className="accent-primary-500 w-4 h-4" />
            Active
          </label>
          <SubmitButton loading={isSubmitting}>{editing ? 'Update Banner' : 'Add Banner'}</SubmitButton>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmRemove}
        title="Delete Banner"
        message={confirmDelete ? `Delete banner "${confirmDelete.title}"?` : ''}
      />
    </div>
  )
}
