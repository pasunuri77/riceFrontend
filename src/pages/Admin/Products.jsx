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
import { safeImageUrl } from '../../utils/sanitize'
import TableShell from '../../components/ui/TableShell'
import SortableHeader from '../../components/ui/SortableHeader'
import ColumnVisibilityMenu from '../../components/ui/ColumnVisibilityMenu'
import ExportMenu from '../../components/ui/ExportMenu'
import BulkActionsBar from '../../components/ui/BulkActionsBar'
import { RowSkeleton } from '../../components/ui/Skeleton'
import { formatINR } from '../../utils/format'
import { exportToCsv, exportToExcel } from '../../utils/exportTable'
import { useToast } from '../../context/ToastContext'
import productApi from '../../api/productApi'
import categoryApi from '../../api/categoryApi'
import brandApi from '../../api/brandApi'
import { ORIGIN_STATES } from '../../data/states'

const PAGE_SIZE = 8
const DESCRIPTION_MAX = 500

const emptyForm = (brandsData, categoriesData) => ({
  name: '', brand: brandsData[0]?.name || '', category: categoriesData[0]?.name || '', description: '',
  origin: ORIGIN_STATES[0], grainLength: '', pricePerKg: '', stock: '', minOrder: 1, maxOrder: 25,
  weightOptions: '1,5,10,25', image: '', status: 'Active',
})

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
  })
  .refine((data) => data.maxOrder >= data.minOrder, {
    message: 'Maximum order must be greater than or equal to minimum order',
    path: ['maxOrder'],
  })

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categoriesData, setCategoriesData] = useState([])
  const [brandsData, setBrandsData] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [visibleCols, setVisibleCols] = useState({})
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const { showToast } = useToast()

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
    defaultValues: emptyForm([], []),
  })

  const description = watch('description')
  const image = watch('image')

  const loadProducts = () => productApi.list().then((list) => setProducts(list.map((p) => ({ ...p, status: p.status || (p.stock > 0 ? 'Active' : 'Inactive') })))).catch(() => setProducts([]))

  useEffect(() => {
    Promise.all([
      loadProducts(),
      categoryApi.list().then(setCategoriesData).catch(() => setCategoriesData([])),
      brandApi.list().then(setBrandsData).catch(() => setBrandsData([])),
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
  const toggleCol = (key) => setVisibleCols((v) => ({ ...v, [key]: v[key] === false ? true : false }))
  const isVisible = (key) => visibleCols[key] !== false

  const toggleSelect = (id) => setSelected((s) => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next })
  const toggleSelectPage = () => setSelected((s) => {
    const allSelected = pageItems.every((p) => s.has(p.id))
    const next = new Set(s)
    pageItems.forEach((p) => (allSelected ? next.delete(p.id) : next.add(p.id)))
    return next
  })
  const clearSelection = () => setSelected(new Set())

  const openAdd = () => { setEditing(null); reset(emptyForm(brandsData, categoriesData)); setModalOpen(true) }
  const openEdit = (p) => {
    setEditing(p)
    reset({ ...p, weightOptions: p.weightOptions.join(',') })
    setModalOpen(true)
  }

  const handleDelete = (id) => {
    productApi.remove(id).then(() => {
      loadProducts()
      showToast('Product deleted', 'success')
    }).catch(() => showToast('Failed to delete product', 'error'))
  }

  const handleBulkDelete = () => {
    setBulkDeleting(true)
    Promise.allSettled([...selected].map((id) => productApi.remove(id)))
      .then((results) => {
        const failed = results.filter((r) => r.status === 'rejected').length
        loadProducts()
        clearSelection()
        if (failed > 0) showToast(`${results.length - failed} deleted, ${failed} failed`, 'error')
        else showToast(`${results.length} product(s) deleted`, 'success')
      })
      .finally(() => setBulkDeleting(false))
  }

  const exportColumns = [
    { label: 'Rice Name', value: (p) => p.name },
    { label: 'Brand', value: (p) => p.brand },
    { label: 'Category', value: (p) => p.category },
    { label: 'Price/KG', value: (p) => p.pricePerKg },
    { label: 'Stock', value: (p) => p.stock },
    { label: 'Min Order', value: (p) => p.minOrder },
    { label: 'Max Order', value: (p) => p.maxOrder },
    { label: 'Status', value: (p) => p.status },
  ]

  const onSubmitProduct = (data) => {
    const payload = {
      ...data,
      mrp: data.pricePerKg * 1.12,
      weightOptions: data.weightOptions.split(',').map((w) => Number(w.trim())).filter(Boolean),
      image: data.image || `https://picsum.photos/seed/${Date.now()}/600/600`,
      rating: editing?.rating || 0,
      reviews: editing?.reviews || 0,
      badges: editing?.badges || [],
    }
    const request = editing ? productApi.update(editing.id, payload) : productApi.create(payload)
    return request.then(() => {
      loadProducts()
      showToast(editing ? 'Product updated' : 'Product added', 'success')
      setModalOpen(false)
    }).catch(() => showToast(editing ? 'Failed to update product' : 'Failed to add product', 'error'))
  }

  const colCount = 2 + COLUMNS.filter((c) => isVisible(c.key)).length + 1

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
        <div className="ml-auto flex items-center gap-2">
          <ColumnVisibilityMenu columns={COLUMNS} visible={visibleCols} onToggle={toggleCol} />
          <ExportMenu
            onExportCsv={() => exportToCsv('products', exportColumns, filtered)}
            onExportExcel={() => exportToExcel('products', exportColumns, filtered)}
          />
        </div>
      </div>

      <BulkActionsBar count={selected.size} onClear={clearSelection}>
        <button onClick={handleBulkDelete} disabled={bulkDeleting} className="btn text-xs px-3 py-1.5 bg-red-500 text-white disabled:opacity-60">
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
              {isVisible('name') && <SortableHeader label="Rice Name" sortKey="name" sort={sort} onSort={toggleSort} />}
              {isVisible('brand') && <SortableHeader label="Brand" sortKey="brand" sort={sort} onSort={toggleSort} />}
              {isVisible('category') && <SortableHeader label="Category" sortKey="category" sort={sort} onSort={toggleSort} />}
              {isVisible('price') && <SortableHeader label="Price/KG" sortKey="price" sort={sort} onSort={toggleSort} />}
              {isVisible('stock') && <SortableHeader label="Stock" sortKey="stock" sort={sort} onSort={toggleSort} />}
              {isVisible('minmax') && <th scope="col" className="p-3.5">Min / Max</th>}
              {isVisible('status') && <th scope="col" className="p-3.5">Status</th>}
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
                {isVisible('name') && <td className="p-3 font-semibold max-w-[220px] truncate">{p.name}</td>}
                {isVisible('brand') && <td className="p-3 text-ink/60">{p.brand}</td>}
                {isVisible('category') && <td className="p-3 text-ink/60">{p.category}</td>}
                {isVisible('price') && <td className="p-3 font-semibold">{formatINR(p.pricePerKg)}</td>}
                {isVisible('stock') && <td className="p-3">{p.stock} kg</td>}
                {isVisible('minmax') && <td className="p-3 text-ink/50">{p.minOrder} / {p.maxOrder}</td>}
                {isVisible('status') && <td className="p-3"><StatusPill status={p.status} /></td>}
                <td className="p-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`} className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-600"><Pencil className="w-4 h-4" aria-hidden="true" /></button>
                    <button onClick={() => handleDelete(p.id)} aria-label={`Delete ${p.name}`} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
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
            <FormField label="Brand" error={errors.brand?.message}>
              <select {...register('brand')} className="input-field" aria-invalid={!!errors.brand}>
                {brandsData.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
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
          <SubmitButton loading={isSubmitting}>{editing ? 'Update Product' : 'Add Product'}</SubmitButton>
        </form>
      </Modal>
    </div>
  )
}
