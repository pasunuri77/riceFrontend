import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'
import EmptyState from '../../components/ui/EmptyState'
import TableShell from '../../components/ui/TableShell'
import { formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import couponApi from '../../api/couponApi'

const schema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20).transform((v) => v.toUpperCase()),
  type: z.enum(['PERCENT', 'FLAT']),
  value: z.coerce.number().positive('Enter a value greater than 0'),
  minOrder: z.coerce.number().min(0),
  expiresAt: z.string().min(1, 'Expiry date is required'),
  active: z.boolean(),
})

// UI form uses a plain <input type="date">; backend wants a full ISO Instant.
// End-of-day on the chosen date is what a customer would expect "expires on X" to mean.
const toIsoInstant = (dateStr) => new Date(`${dateStr}T23:59:59`).toISOString()
const toDateInput = (iso) => (iso ? iso.slice(0, 10) : '')

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { showToast } = useToast()

  const loadCoupons = () => couponApi.list().then(setCoupons).catch(() => setCoupons([]))

  useEffect(() => {
    loadCoupons().finally(() => setLoading(false))
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { code: '', type: 'PERCENT', value: '', minOrder: 0, expiresAt: '', active: true },
  })

  const openAdd = () => { setEditing(null); reset({ code: '', type: 'PERCENT', value: '', minOrder: 0, expiresAt: '', active: true }); setModalOpen(true) }
  const openEdit = (c) => {
    setEditing(c)
    // The backend returns `type` lowercased ("percent") even though it requires
    // uppercase ("PERCENT") on write - normalize on read so the dropdown and the
    // "% vs ₹" display match, rather than silently landing on the wrong option.
    reset({ code: c.code, type: (c.type || '').toUpperCase(), value: c.value, minOrder: c.minOrder, expiresAt: toDateInput(c.expiresAt), active: c.active })
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    const payload = { ...data, expiresAt: toIsoInstant(data.expiresAt) }
    try {
      if (editing) {
        await couponApi.update(editing.id, payload)
        showToast('Coupon updated', 'success')
      } else {
        await couponApi.create(payload)
        showToast('Coupon added', 'success')
      }
      await loadCoupons()
      setModalOpen(false)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to save coupon', 'error')
    }
  }

  const confirmRemove = async () => {
    setDeleting(true)
    try {
      await couponApi.remove(confirmDelete.id)
      showToast('Coupon removed', 'success')
      await loadCoupons()
      setConfirmDelete(null)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to delete coupon', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Coupons' }]} />
      <PageHeader
        title="Coupon Management"
        subtitle="Create and manage discount codes"
        action={<button onClick={openAdd} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add Coupon</button>}
      />

      {loading ? (
        <div className="skeleton h-40 rounded-2xl" />
      ) : coupons.length === 0 ? (
        <EmptyState icon={Tag} title="No coupons yet" subtitle="Create your first coupon to see it here." actionLabel="Add Coupon" onAction={openAdd} />
      ) : (
        <TableShell minWidth="640px">
          <thead>
            <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th scope="col" className="p-3.5">Code</th>
              <th scope="col" className="p-3.5">Discount</th>
              <th scope="col" className="p-3.5">Min Order</th>
              <th scope="col" className="p-3.5">Expires</th>
              <th scope="col" className="p-3.5">Status</th>
              <th scope="col" className="p-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-black/5 last:border-0 hover:bg-primary-50/40">
                <td className="p-3 font-mono font-bold text-primary-700">{c.code}</td>
                <td className="p-3">{(c.type || '').toUpperCase() === 'PERCENT' ? `${c.value}% OFF` : `₹${c.value} OFF`}</td>
                <td className="p-3 text-ink/60">{c.minOrder > 0 ? `₹${c.minOrder}` : '-'}</td>
                <td className="p-3 text-ink/60">{c.expiresAt ? formatDate(c.expiresAt) : 'No expiry'}</td>
                <td className="p-3"><span className={`badge ${c.active ? 'bg-leaf-100 text-leaf-700' : 'bg-black/10 text-ink/50'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                <td className="p-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(c)} aria-label={`Edit ${c.code}`} className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-600"><Pencil className="w-4 h-4" aria-hidden="true" /></button>
                    <button onClick={() => setConfirmDelete(c)} aria-label={`Delete ${c.code}`} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Coupon' : 'Add Coupon'} maxWidth="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Coupon Code" error={errors.code?.message}>
            <input {...register('code')} autoFocus className="input-field uppercase" aria-invalid={!!errors.code} placeholder="e.g. WELCOME10" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Discount Type">
              <select {...register('type')} className="input-field">
                <option value="PERCENT">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
              </select>
            </FormField>
            <FormField label="Value" error={errors.value?.message}>
              <input {...register('value')} type="number" step="0.01" className="input-field" aria-invalid={!!errors.value} />
            </FormField>
          </div>
          <FormField label="Minimum Order Value (₹)">
            <input {...register('minOrder')} type="number" className="input-field" />
          </FormField>
          <FormField label="Expiry Date" error={errors.expiresAt?.message}>
            <input {...register('expiresAt')} type="date" className="input-field" aria-invalid={!!errors.expiresAt} />
          </FormField>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register('active')} className="accent-primary-500 w-4 h-4" />
            Active
          </label>
          <SubmitButton loading={isSubmitting}>{editing ? 'Update Coupon' : 'Add Coupon'}</SubmitButton>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmRemove}
        loading={deleting}
        title="Delete Coupon"
        message={confirmDelete ? `Delete coupon "${confirmDelete.code}"?` : ''}
      />
    </div>
  )
}
