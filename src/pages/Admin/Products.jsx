import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import StatusPill from '../../components/ui/StatusPill'
import Pagination from '../../components/ui/Pagination'
import { formatINR } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import productApi from '../../api/productApi'
import categoryApi from '../../api/categoryApi'
import brandApi from '../../api/brandApi'
import { ORIGIN_STATES } from '../../data/states'

const PAGE_SIZE = 8
const emptyForm = (brandsData, categoriesData) => ({
  name: '', brand: brandsData[0]?.name || '', category: categoriesData[0]?.name || '', description: '',
  origin: ORIGIN_STATES[0], grainLength: '', pricePerKg: '', stock: '', minOrder: 1, maxOrder: 25,
  weightOptions: '1,5,10,25', image: '', status: 'Active',
})

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categoriesData, setCategoriesData] = useState([])
  const [brandsData, setBrandsData] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm([], []))
  const { showToast } = useToast()

  const loadProducts = () => productApi.list().then((list) => setProducts(list.map((p) => ({ ...p, status: p.status || (p.stock > 0 ? 'Active' : 'Inactive') })))).catch(() => setProducts([]))

  useEffect(() => {
    loadProducts()
    categoryApi.list().then(setCategoriesData).catch(() => setCategoriesData([]))
    brandApi.list().then(setBrandsData).catch(() => setBrandsData([]))
  }, [])

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openAdd = () => { setEditing(null); setForm(emptyForm(brandsData, categoriesData)); setModalOpen(true) }
  const openEdit = (p) => {
    setEditing(p)
    setForm({ ...p, weightOptions: p.weightOptions.join(',') })
    setModalOpen(true)
  }

  const handleDelete = (id) => {
    productApi.remove(id).then(() => {
      loadProducts()
      showToast('Product deleted', 'success')
    }).catch(() => showToast('Failed to delete product', 'error'))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      pricePerKg: Number(form.pricePerKg),
      mrp: Number(form.pricePerKg) * 1.12,
      stock: Number(form.stock),
      minOrder: Number(form.minOrder),
      maxOrder: Number(form.maxOrder),
      weightOptions: form.weightOptions.split(',').map((w) => Number(w.trim())).filter(Boolean),
      image: form.image || `https://picsum.photos/seed/${Date.now()}/600/600`,
      rating: editing?.rating || 0,
      reviews: editing?.reviews || 0,
      badges: editing?.badges || [],
    }
    const request = editing ? productApi.update(editing.id, payload) : productApi.create(payload)
    request.then(() => {
      loadProducts()
      showToast(editing ? 'Product updated' : 'Product added', 'success')
      setModalOpen(false)
    }).catch(() => showToast(editing ? 'Failed to update product' : 'Failed to add product', 'error'))
  }

  return (
    <div>
      <PageHeader
        title="Product Management"
        subtitle={`${products.length} products in catalogue`}
        action={<button onClick={openAdd} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add Product</button>}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search products..." className="input-field pl-10" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[880px]">
          <thead>
            <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th className="p-3.5">Image</th>
              <th className="p-3.5">Rice Name</th>
              <th className="p-3.5">Brand</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Price/KG</th>
              <th className="p-3.5">Stock</th>
              <th className="p-3.5">Min / Max</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((p) => (
              <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-primary-50/40">
                <td className="p-3"><img src={p.image} alt="" className="w-11 h-11 rounded-lg object-cover" /></td>
                <td className="p-3 font-semibold max-w-[220px] truncate">{p.name}</td>
                <td className="p-3 text-ink/60">{p.brand}</td>
                <td className="p-3 text-ink/60">{p.category}</td>
                <td className="p-3 font-semibold">{formatINR(p.pricePerKg)}</td>
                <td className="p-3">{p.stock} kg</td>
                <td className="p-3 text-ink/50">{p.minOrder} / {p.maxOrder}</td>
                <td className="p-3"><StatusPill status={p.status} /></td>
                <td className="p-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add New Product'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label-field">Rice Name</label><input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Brand</label>
              <select className="input-field" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
                {brandsData.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Rice Category</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categoriesData.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label-field">Description</label><textarea rows={2} className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Origin State</label>
              <select className="input-field" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })}>
                {ORIGIN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label-field">Grain Length</label><input className="input-field" value={form.grainLength} onChange={(e) => setForm({ ...form, grainLength: e.target.value })} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label-field">Base Price/KG (₹)</label><input required type="number" className="input-field" value={form.pricePerKg} onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })} /></div>
            <div><label className="label-field">Available Stock (kg)</label><input required type="number" className="input-field" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label-field">Minimum Order Qty</label><input type="number" className="input-field" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} /></div>
            <div><label className="label-field">Maximum Order Qty</label><input type="number" className="input-field" value={form.maxOrder} onChange={(e) => setForm({ ...form, maxOrder: e.target.value })} /></div>
          </div>
          <div><label className="label-field">Weight Options (comma separated, kg)</label><input className="input-field" value={form.weightOptions} onChange={(e) => setForm({ ...form, weightOptions: e.target.value })} /></div>
          <div><label className="label-field">Rice Image URL</label><input className="input-field" placeholder="https://..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
          <div>
            <label className="label-field">Status</label>
            <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Active</option><option>Inactive</option>
            </select>
          </div>
          <button className="btn-primary w-full">{editing ? 'Update Product' : 'Add Product'}</button>
        </form>
      </Modal>
    </div>
  )
}
