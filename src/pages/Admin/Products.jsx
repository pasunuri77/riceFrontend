import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import Modal from '../../components/ui/Modal'
import StatusPill from '../../components/ui/StatusPill'
import Pagination from '../../components/ui/Pagination'
import SearchInput from '../../components/ui/SearchInput'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'
import ImageDropzone from '../../components/ui/ImageDropzone'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { safeImageUrl } from '../../utils/sanitize'
import TableShell from '../../components/ui/TableShell'
import SortableHeader from '../../components/ui/SortableHeader'
import BulkActionsBar from '../../components/ui/BulkActionsBar'
import { RowSkeleton } from '../../components/ui/Skeleton'
import { formatINR } from '../../utils/format'
import { getStockStatus } from '../../utils/stock'
import { useToast } from '../../context/ToastContext'
import { useNotifications } from '../../context/NotificationContext'
import { FEATURED_BRAND } from '../../hooks/useHomeProducts'
import productApi from '../../api/productApi'
import categoryApi from '../../api/categoryApi'
import { ORIGIN_STATES } from '../../data/states'

const PAGE_SIZE = 8
const DESCRIPTION_MAX = 500

const emptyForm = (categoriesData) => ({
  name: '', brand: FEATURED_BRAND, category: categoriesData[0]?.name || '', description: '',
  origin: ORIGIN_STATES[0], grainLength: '', pricePerKg: '', stock: '', minOrder: 1, maxOrder: 25,
  weightOptions: '1,5,10,25', image: '', status: 'Active', badges: [],
})

// The homepage's "Today's Offers" section (and the Best Seller/Organic labels
// everywhere else) are driven entirely by this real, admin-editable `badges`
// list on the product - checking "Limited Offer" here is what puts a product
// in Today's Offers. There's no separate priority/ordering field yet (see
// BACKEND_TODO), so Today's Offers currently just shows whichever matching
// products the API returns, capped to 4.
const BADGE_OPTIONS = ['Best Seller', 'New Arrival', 'Limited Offer', 'Organic']

const COLUMNS = [
  { key: 'name', label: 'Rice Name', sortField: 'name' },
  { key: 'brand', label: 'Brand', sortField: 'brand' },
  { key: 'category', label: 'Category', sortField: 'category' },
  { key: 'price', label: 'Price/KG', sortField: 'pricePerKg' },
  { key: 'stock', label: 'Stock', sortField: 'stock' },
  { key: 'minmax', label: 'Min / Max' },
  { key: 'status', label: 'Status' },
]

const productSchema = z
  .object({
    name: z.string().min(1, 'Rice name is required'),
    brand: z.string().min(1, 'Brand is required'),
    category: z.string().min(1, 'Category is required'),
    description: z.string().max(DESCRIPTION_MAX, `Description must be under ${DESCRIPTION_MAX} characters`).optional(),
    origin: z.string().min(1, 'Origin state is required'),
    grainLength: z.string().optional(),
    pricePerKg: z.coerce.number({ invalid_type_error: 'Enter a valid price' }).positive('Price must be greater than 0'),
    stock: z.coerce.number({ invalid_type_error: 'Enter a valid stock quantity' }).int('Stock must be a whole number').min(0, 'Stock cannot be negative'),
    minOrder: z.coerce.number({ invalid_type_error: 'Enter a valid quantity' }).int().positive('Minimum order must be at least 1'),
    maxOrder: z.coerce.number({ invalid_type_error: 'Enter a valid quantity' }).int().positive('Maximum order must be at least 1'),
    weightOptions: z.string().min(1, 'Enter at least one weight option'),
    image: z.string().optional(),
    status: z.string(),
    badges: z.array(z.string()).default([]),
  })
  .refine((data) => data.maxOrder >= data.minOrder, {
    message: 'Maximum order must be greater than or equal to minimum order',
    path: ['maxOrder'],
  })

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categoriesData, setCategoriesData] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { showToast } = useToast()
  const { notify } = useNotifications()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    mode: 'onTouched',
    defaultValues: emptyForm([]),
  })

  const description = watch('description')
  const image = watch('image')
  const badges = watch('badges') || []
  const toggleBadge = (label) => {
    setValue('badges', badges.includes(label) ? badges.filter((b) => b !== label) : [...badges, label], { shouldDirty: true })
  }

  // The storefront only carries FEATURED_BRAND right now - the admin catalogue is
  // scoped to match, so it never shows or lets you manage a brand that can't
  // actually appear anywhere on the site.
  const loadProducts = () => productApi.list()
    .then((list) => setProducts(
      list
        .filter((p) => p.brand === FEATURED_BRAND)
        .map((p) => ({ ...p, status: p.status || (p.stock > 0 ? 'Active' : 'Inactive') }))
    ))
    .catch(() => setProducts([]))

  useEffect(() => {
    Promise.all([
      loadProducts(),
      categoryApi.list().then(setCategoriesData).catch(() => setCategoriesData([])),
    ]).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()))
    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter)
    if (statusFilter) list = list.filter((p) => p.status === statusFilter)
    if (sort.key) {
      const field = COLUMNS.find((c) => c.key === sort.key)?.sortField
      list = [...list].sort((a, b) => {
        let av = a[field]; let bv = b[field]
        if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase() }
        if (av < bv) return sort.dir === 'asc' ? -1 : 1
        if (av > bv) return sort.dir === 'asc' ? 1 : -1
        return 0
      })
    }
    return list
  }, [products, search, categoryFilter, statusFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  const toggleSelect = (id) => setSelected((s) => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next })
  const toggleSelectPage = () => setSelected((s) => {
    const allSelected = pageItems.every((p) => s.has(p.id))
    const next = new Set(s)
    pageItems.forEach((p) => (allSelected ? next.delete(p.id) : next.add(p.id)))
    return next
  })
  const clearSelection = () => setSelected(new Set())

  const openAdd = () => { setEditing(null); reset(emptyForm(categoriesData)); setModalOpen(true) }
  const openEdit = (p) => {
    setEditing(p)
    reset({ ...p, weightOptions: p.weightOptions.join(',') })
    setModalOpen(true)
  }

  const confirmDeleteOne = () => {
    setDeleting(true)
    const deletedName = confirmDelete.name
    productApi.remove(confirmDelete.id).then(() => {
      loadProducts()
      showToast('Product deleted', 'success')
      notify('ADMIN_PRODUCT_DELETED', { productName: deletedName })
      setConfirmDelete(null)
    }).catch(() => showToast('Failed to delete product', 'error'))
      .finally(() => setDeleting(false))
  }

  const handleBulkDelete = () => {
    setBulkDeleting(true)
    Promise.allSettled([...selected].map((id) => productApi.remove(id)))
      .then((results) => {
        const failed = results.filter((r) => r.status === 'rejected').length
        loadProducts()
        clearSelection()
        setConfirmBulkDelete(false)
        if (failed > 0) showToast(`${results.length - failed} deleted, ${failed} failed`, 'error')
        else showToast(`${results.length} product(s) deleted`, 'success')
        const succeeded = results.length - failed
        if (succeeded > 0) notify('ADMIN_PRODUCT_DELETED', { productName: `${succeeded} products` })
      })
      .finally(() => setBulkDeleting(false))
  }

  const onSubmitProduct = (data) => {
    const payload = {
      ...data,
      mrp: data.pricePerKg * 1.12,
      weightOptions: data.weightOptions.split(',').map((w) => Number(w.trim())).filter(Boolean),
      image: data.image || '',
      rating: editing?.rating || 0,
      reviews: editing?.reviews || 0,
      badges: data.badges || [],
    }
    const request = editing ? productApi.update(editing.id, payload) : productApi.create(payload)
    return request.then(() => {
      loadProducts()
      showToast(editing ? 'Product updated' : 'Product added', 'success')
      notify(editing ? 'ADMIN_PRODUCT_UPDATED' : 'ADMIN_PRODUCT_ADDED', { productName: data.name })
      setModalOpen(false)
    }).catch(() => showToast(editing ? 'Failed to update product' : 'Failed to add product', 'error'))
  }

  const colCount = 2 + COLUMNS.length + 1

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Products' }]} />
      <PageHeader
        title="Product Management"
        subtitle={`${filtered.length} of ${products.length} products`}
        action={<button onClick={openAdd} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add Product</button>}
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search products..." className="max-w-sm" />
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="input-field !w-auto text-sm">
          <option value="">All Categories</option>
          {categoriesData.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input-field !w-auto text-sm">
          <option value="">All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      <BulkActionsBar count={selected.size} onClear={clearSelection}>
        <button onClick={() => setConfirmBulkDelete(true)} disabled={bulkDeleting} className="btn text-xs px-3 py-1.5 bg-red-500 text-white disabled:opacity-60">
          <Trash2 className="w-3.5 h-3.5" /> {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
        </button>
      </BulkActionsBar>

      <TableShell minWidth="960px">
          <thead>
            <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th scope="col" className="p-3.5 w-10">
                <input type="checkbox" aria-label="Select all products on this page" className="accent-primary-500 w-4 h-4" checked={pageItems.length > 0 && pageItems.every((p) => selected.has(p.id))} onChange={toggleSelectPage} />
              </th>
              <th scope="col" className="p-3.5">Image</th>
              <SortableHeader label="Rice Name" sortKey="name" sort={sort} onSort={toggleSort} />
              <SortableHeader label="Brand" sortKey="brand" sort={sort} onSort={toggleSort} />
              <SortableHeader label="Category" sortKey="category" sort={sort} onSort={toggleSort} />
              <SortableHeader label="Price/KG" sortKey="price" sort={sort} onSort={toggleSort} />
              <SortableHeader label="Stock" sortKey="stock" sort={sort} onSort={toggleSort} />
              <th scope="col" className="p-3.5">Min / Max</th>
              <th scope="col" className="p-3.5">Status</th>
              <th scope="col" className="p-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} cols={colCount} />)
            ) : pageItems.length === 0 ? (
              <tr><td colSpan={colCount} className="p-8 text-center text-sm text-ink/40">No products found.</td></tr>
            ) : pageItems.map((p) => (
              <tr key={p.id} className={`border-b border-black/5 last:border-0 hover:bg-primary-50/40 ${selected.has(p.id) ? 'bg-primary-50/60' : ''}`}>
                <td className="p-3"><input type="checkbox" aria-label={`Select ${p.name}`} className="accent-primary-500 w-4 h-4" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                <td className="p-3"><img src={safeImageUrl(p.image)} alt="" className="w-11 h-11 rounded-lg object-cover" /></td>
                <td className="p-3 font-semibold max-w-[220px] truncate">{p.name}</td>
                <td className="p-3 text-ink/60">{p.brand}</td>
                <td className="p-3 text-ink/60">{p.category}</td>
                <td className="p-3 font-semibold">{formatINR(p.pricePerKg)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span>{p.stock} kg</span>
                    {getStockStatus(p.stock) === 'low' && <span className="badge bg-amber-100 text-amber-700 text-[10px]">Low</span>}
                    {getStockStatus(p.stock) === 'out' && <span className="badge bg-red-100 text-red-600 text-[10px]">Out</span>}
                  </div>
                </td>
                <td className="p-3 text-ink/50">{p.minOrder} / {p.maxOrder}</td>
                <td className="p-3"><StatusPill status={p.status} /></td>
                <td className="p-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`} className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-600"><Pencil className="w-4 h-4" aria-hidden="true" /></button>
                    <button onClick={() => setConfirmDelete(p)} aria-label={`Delete ${p.name}`} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
      </TableShell>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add New Product'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmitProduct)} className="space-y-4" noValidate>
          <FormField label="Rice Name" error={errors.name?.message}>
            <input {...register('name')} autoFocus className="input-field" aria-invalid={!!errors.name} />
          </FormField>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Brand" hint="The storefront currently carries one brand only.">
              <select {...register('brand')} className="input-field">
                <option value={FEATURED_BRAND}>{FEATURED_BRAND}</option>
              </select>
            </FormField>
            <FormField label="Rice Category" error={errors.category?.message}>
              <select {...register('category')} className="input-field" aria-invalid={!!errors.category}>
                {categoriesData.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Description" error={errors.description?.message} maxLength={DESCRIPTION_MAX} currentLength={description?.length}>
            <textarea {...register('description')} rows={2} className="input-field" aria-invalid={!!errors.description} />
          </FormField>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Origin State" error={errors.origin?.message}>
              <select {...register('origin')} className="input-field" aria-invalid={!!errors.origin}>
                {ORIGIN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Grain Length">
              <input {...register('grainLength')} className="input-field" />
            </FormField>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Base Price/KG (₹)" error={errors.pricePerKg?.message}>
              <input {...register('pricePerKg')} type="number" step="0.01" className="input-field" aria-invalid={!!errors.pricePerKg} />
            </FormField>
            <FormField label="Available Stock (kg)" error={errors.stock?.message}>
              <input {...register('stock')} type="number" className="input-field" aria-invalid={!!errors.stock} />
            </FormField>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Minimum Order Qty" error={errors.minOrder?.message}>
              <input {...register('minOrder')} type="number" className="input-field" aria-invalid={!!errors.minOrder} />
            </FormField>
            <FormField label="Maximum Order Qty" error={errors.maxOrder?.message}>
              <input {...register('maxOrder')} type="number" className="input-field" aria-invalid={!!errors.maxOrder} />
            </FormField>
          </div>
          <FormField label="Weight Options (comma separated, kg)" error={errors.weightOptions?.message}>
            <input {...register('weightOptions')} className="input-field" aria-invalid={!!errors.weightOptions} />
          </FormField>
          <FormField label="Rice Image">
            <ImageDropzone value={image || ''} onChange={(url) => setValue('image', url, { shouldValidate: true })} />
          </FormField>
          <FormField label="Status">
            <select {...register('status')} className="input-field">
              <option>Active</option><option>Inactive</option>
            </select>
          </FormField>

          <FormField label="Promotional Badges" hint="Shown on this product's storefront card. Limited Offer also puts it in the homepage's Today's Offers section.">
            <div className="flex flex-wrap gap-2">
              {BADGE_OPTIONS.map((label) => {
                const active = badges.includes(label)
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleBadge(label)}
                    aria-pressed={active}
                    className={`badge cursor-pointer transition ${active ? 'bg-primary-500 text-white' : 'bg-black/5 text-ink/60 hover:bg-black/10'}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </FormField>

          <div className="rounded-xl border border-dashed border-black/10 p-4 text-xs text-ink/40">
            <p className="font-semibold text-ink/50 mb-1">Supplier &amp; Batch Tracking</p>
            <p>Not yet available - the backend doesn't track supplier or batch/lot data per product. Add these fields there to enable this section.</p>
          </div>

          <SubmitButton loading={isSubmitting}>{editing ? 'Update Product' : 'Add Product'}</SubmitButton>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteOne}
        loading={deleting}
        title="Delete Product"
        message={confirmDelete ? `Delete "${confirmDelete.name}"? This can't be undone.` : ''}
      />
      <ConfirmDialog
        open={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={handleBulkDelete}
        loading={bulkDeleting}
        title="Delete Products"
        message={`Delete ${selected.size} selected product(s)? This can't be undone.`}
      />
    </div>
  )
}
