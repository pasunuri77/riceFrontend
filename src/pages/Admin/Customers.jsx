import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, Ban, CheckCircle2, Package } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import Modal from '../../components/ui/Modal'
import StatusPill from '../../components/ui/StatusPill'
import Pagination from '../../components/ui/Pagination'
import SearchInput from '../../components/ui/SearchInput'
import TableShell from '../../components/ui/TableShell'
import SortableHeader from '../../components/ui/SortableHeader'
import ColumnVisibilityMenu from '../../components/ui/ColumnVisibilityMenu'
import ExportMenu from '../../components/ui/ExportMenu'
import BulkActionsBar from '../../components/ui/BulkActionsBar'
import { formatINR, formatDate, fitTextSizeClass } from '../../utils/format'
import { exportToCsv, exportToExcel } from '../../utils/exportTable'
import { useToast } from '../../context/ToastContext'
import customerApi from '../../api/customerApi'
import orderApi from '../../api/orderApi'
import { RowSkeleton } from '../../components/ui/Skeleton'

const itemsSummary = (o) => (o.items?.length ? o.items.map((i) => `${i.name} (${i.weight}kg x${i.qty})`).join(', ') : o.riceName)

const PAGE_SIZE = 8
const MODAL_STAT_SCALE = ['text-lg', 'text-base', 'text-sm']
const STATUS_TABS = ['All', 'Active', 'Blocked']

const COLUMNS = [
  { key: 'name', label: 'Customer', sortField: 'name' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'orders', label: 'Orders', sortField: 'orders' },
  { key: 'totalSpent', label: 'Total Spent', sortField: 'totalSpent' },
  { key: 'joined', label: 'Joined', sortField: 'joined' },
  { key: 'status', label: 'Status' },
]

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [ordersData, setOrdersData] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [sort, setSort] = useState({ key: 'joined', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [visibleCols, setVisibleCols] = useState({})
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    Promise.all([
      customerApi.list().then(setCustomers).catch(() => setCustomers([])),
      orderApi.listAll().then(setOrdersData).catch(() => setOrdersData([])),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const id = searchParams.get('id')
    if (!id || customers.length === 0) return
    const match = customers.find((c) => c.id === id)
    if (match) setViewing(match)
    setSearchParams({}, { replace: true })
  }, [searchParams, customers])

  const counts = useMemo(() => ({
    All: customers.length,
    Active: customers.filter((c) => c.status === 'Active').length,
    Blocked: customers.filter((c) => c.status === 'Blocked').length,
  }), [customers])

  const list = useMemo(() => {
    let next = customers.filter((c) =>
      (status === 'All' || c.status === status) &&
      `${c.name} ${c.email} ${c.mobile}`.toLowerCase().includes(search.toLowerCase())
    )
    if (sort.key) {
      const field = COLUMNS.find((c) => c.key === sort.key)?.sortField
      next = [...next].sort((a, b) => {
        let av = a[field]; let bv = b[field]
        if (field === 'joined') { av = new Date(av); bv = new Date(bv) }
        if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase() }
        if (av < bv) return sort.dir === 'asc' ? -1 : 1
        if (av > bv) return sort.dir === 'asc' ? 1 : -1
        return 0
      })
    }
    return next
  }, [customers, search, status, sort])

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const pageItems = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  const toggleCol = (key) => setVisibleCols((v) => ({ ...v, [key]: v[key] === false ? true : false }))
  const isVisible = (key) => visibleCols[key] !== false

  const toggleSelect = (id) => setSelected((s) => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next })
  const toggleSelectPage = () => setSelected((s) => {
    const allSelected = pageItems.every((c) => s.has(c.id))
    const next = new Set(s)
    pageItems.forEach((c) => (allSelected ? next.delete(c.id) : next.add(c.id)))
    return next
  })
  const clearSelection = () => setSelected(new Set())

  const toggleStatus = (c) => {
    const nextStatus = c.status === 'Active' ? 'Blocked' : 'Active'
    customerApi.updateStatus(c.id, nextStatus).then((updated) => {
      setCustomers((prev) => prev.map((x) => (x.id === c.id ? updated : x)))
      setViewing((v) => (v?.id === c.id ? updated : v))
      showToast(nextStatus === 'Blocked' ? `${c.name} blocked` : `${c.name} unblocked`, nextStatus === 'Blocked' ? 'error' : 'success')
    })
  }

  // No bulk-delete endpoint exists for customers, so bulk actions reuse the
  // real per-customer status endpoint instead of fabricating a delete.
  const handleBulkStatus = (nextStatus) => {
    setBulkUpdating(true)
    Promise.allSettled([...selected].map((id) => customerApi.updateStatus(id, nextStatus)))
      .then((results) => {
        const updatedById = new Map()
        results.forEach((r) => { if (r.status === 'fulfilled') updatedById.set(r.value.id, r.value) })
        setCustomers((prev) => prev.map((c) => updatedById.get(c.id) || c))
        const failed = results.filter((r) => r.status === 'rejected').length
        clearSelection()
        if (failed > 0) showToast(`${results.length - failed} updated, ${failed} failed`, 'error')
        else showToast(`${results.length} customer(s) ${nextStatus === 'Blocked' ? 'blocked' : 'unblocked'}`, 'success')
      })
      .finally(() => setBulkUpdating(false))
  }

  const customerOrders = (id) => ordersData.filter((o) => o.customerId === id)

  const exportColumns = [
    { label: 'Name', value: (c) => c.name },
    { label: 'Email', value: (c) => c.email },
    { label: 'Mobile', value: (c) => c.mobile },
    { label: 'Orders', value: (c) => c.orders },
    { label: 'Total Spent', value: (c) => c.totalSpent },
    { label: 'Joined', value: (c) => c.joined },
    { label: 'Status', value: (c) => c.status },
  ]

  const colCount = 2 + COLUMNS.filter((c) => isVisible(c.key)).length + 1

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Customers' }]} />
      <PageHeader title="Customer Management" subtitle={`${list.length} of ${customers.length} customers`} />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2">
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }} className={`px-4 py-2 rounded-lg text-sm font-semibold ${status === s ? 'bg-primary-500 text-white' : 'bg-white border border-black/10 text-ink/60'}`}>
              {s} ({counts[s]})
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search name, email, mobile..." className="" inputClassName="!w-64" />
          <ColumnVisibilityMenu columns={COLUMNS} visible={visibleCols} onToggle={toggleCol} />
          <ExportMenu
            onExportCsv={() => exportToCsv('customers', exportColumns, list)}
            onExportExcel={() => exportToExcel('customers', exportColumns, list)}
          />
        </div>
      </div>

      <BulkActionsBar count={selected.size} onClear={clearSelection}>
        <button onClick={() => handleBulkStatus('Blocked')} disabled={bulkUpdating} className="btn text-xs px-3 py-1.5 bg-red-500 text-white disabled:opacity-60">
          <Ban className="w-3.5 h-3.5" /> Block
        </button>
        <button onClick={() => handleBulkStatus('Active')} disabled={bulkUpdating} className="btn text-xs px-3 py-1.5 bg-leaf-600 text-white disabled:opacity-60">
          <CheckCircle2 className="w-3.5 h-3.5" /> Unblock
        </button>
      </BulkActionsBar>

      <TableShell minWidth="900px">
          <thead>
            <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th scope="col" className="p-3.5 w-10">
                <input type="checkbox" aria-label="Select all customers on this page" className="accent-primary-500 w-4 h-4" checked={pageItems.length > 0 && pageItems.every((c) => selected.has(c.id))} onChange={toggleSelectPage} />
              </th>
              {isVisible('name') && <SortableHeader label="Customer" sortKey="name" sort={sort} onSort={toggleSort} />}
              {isVisible('mobile') && <th scope="col" className="p-3.5">Mobile</th>}
              {isVisible('orders') && <SortableHeader label="Orders" sortKey="orders" sort={sort} onSort={toggleSort} />}
              {isVisible('totalSpent') && <SortableHeader label="Total Spent" sortKey="totalSpent" sort={sort} onSort={toggleSort} />}
              {isVisible('joined') && <SortableHeader label="Joined" sortKey="joined" sort={sort} onSort={toggleSort} />}
              {isVisible('status') && <th scope="col" className="p-3.5">Status</th>}
              <th scope="col" className="p-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} cols={colCount} />)}
            {!loading && pageItems.map((c) => (
              <tr key={c.id} className={`border-b border-black/5 last:border-0 hover:bg-primary-50/40 ${selected.has(c.id) ? 'bg-primary-50/60' : ''}`}>
                <td className="p-3"><input type="checkbox" aria-label={`Select ${c.name}`} className="accent-primary-500 w-4 h-4" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                {isVisible('name') && (
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">{c.name[0]}</div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{c.name}</p>
                        <p className="text-xs text-ink/40 truncate">{c.email}</p>
                      </div>
                    </div>
                  </td>
                )}
                {isVisible('mobile') && <td className="p-3 text-ink/60">{c.mobile}</td>}
                {isVisible('orders') && <td className="p-3 font-semibold">{c.orders}</td>}
                {isVisible('totalSpent') && <td className="p-3 font-semibold">{formatINR(c.totalSpent)}</td>}
                {isVisible('joined') && <td className="p-3 text-ink/50">{formatDate(c.joined)}</td>}
                {isVisible('status') && <td className="p-3"><StatusPill status={c.status} /></td>}
                <td className="p-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => setViewing(c)} aria-label={`View ${c.name}`} className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-600"><Eye className="w-4 h-4" aria-hidden="true" /></button>
                    <button
                      onClick={() => toggleStatus(c)}
                      aria-label={c.status === 'Active' ? `Block ${c.name}` : `Unblock ${c.name}`}
                      className={`p-1.5 rounded-lg ${c.status === 'Active' ? 'hover:bg-red-100 text-red-500' : 'hover:bg-leaf-100 text-leaf-600'}`}
                    >
                      {c.status === 'Active' ? <Ban className="w-4 h-4" aria-hidden="true" /> : <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && pageItems.length === 0 && (
              <tr><td colSpan={colCount} className="p-8 text-center text-ink/40">No customers match your filters.</td></tr>
            )}
          </tbody>
      </TableShell>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Customer Details" maxWidth="max-w-lg">
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold shrink-0">{viewing.name[0]}</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{viewing.name}</p>
                <p className="text-sm text-ink/50 truncate">{viewing.email}</p>
              </div>
              <StatusPill status={viewing.status} />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-primary-50 rounded-xl p-3"><p className={`${fitTextSizeClass(viewing.orders, MODAL_STAT_SCALE)} font-extrabold font-display whitespace-nowrap`}>{viewing.orders}</p><p className="text-[11px] text-ink/50 mt-0.5">Orders</p></div>
              <div className="bg-primary-50 rounded-xl p-3"><p className={`${fitTextSizeClass(formatINR(viewing.totalSpent), MODAL_STAT_SCALE)} font-extrabold font-display whitespace-nowrap`}>{formatINR(viewing.totalSpent)}</p><p className="text-[11px] text-ink/50 mt-0.5">Total Spent</p></div>
              <div className="bg-primary-50 rounded-xl p-3"><p className={`${fitTextSizeClass(formatDate(viewing.joined), MODAL_STAT_SCALE)} font-extrabold font-display whitespace-nowrap`}>{formatDate(viewing.joined)}</p><p className="text-[11px] text-ink/50 mt-0.5">Joined</p></div>
            </div>

            <div className="flex justify-between text-sm border-t border-black/5 pt-3">
              <span className="text-ink/50">Mobile</span><span className="font-semibold">{viewing.mobile}</span>
            </div>

            <div>
              <p className="font-bold text-sm mb-2">Recent Orders</p>
              {customerOrders(viewing.id).length === 0 ? (
                <p className="text-sm text-ink/40 flex items-center gap-2"><Package className="w-4 h-4" /> No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {customerOrders(viewing.id).map((o) => (
                    <div key={o.id} className="flex items-center justify-between text-sm bg-black/[0.02] rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{itemsSummary(o)}</p>
                        <p className="text-xs text-ink/40">{o.id} • {formatDate(o.date)}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-bold">{formatINR(o.amount)}</p>
                        <StatusPill status={o.deliveryStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => toggleStatus(viewing)} className={`btn w-full ${viewing.status === 'Active' ? 'bg-red-50 text-red-500' : 'bg-leaf-50 text-leaf-700'}`}>
              {viewing.status === 'Active' ? <><Ban className="w-4 h-4" /> Block Customer</> : <><CheckCircle2 className="w-4 h-4" /> Unblock Customer</>}
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
