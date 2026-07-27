import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Eye, Ban, CheckCircle2, Package } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import StatusPill from '../../components/ui/StatusPill'
import Pagination from '../../components/ui/Pagination'
import { formatINR, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import customerApi from '../../api/customerApi'
import orderApi from '../../api/orderApi'

const PAGE_SIZE = 8
const STATUS_TABS = ['All', 'Active', 'Blocked']
const SORTS = [
  { key: 'recent', label: 'Recently Joined' },
  { key: 'name', label: 'Name (A-Z)' },
  { key: 'orders', label: 'Most Orders' },
  { key: 'spent', label: 'Highest Spend' },
]

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [ordersData, setOrdersData] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState(null)
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    customerApi.list().then(setCustomers)
    orderApi.listAll().then(setOrdersData)
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
    if (sort === 'name') next = [...next].sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'orders') next = [...next].sort((a, b) => b.orders - a.orders)
    else if (sort === 'spent') next = [...next].sort((a, b) => b.totalSpent - a.totalSpent)
    else next = [...next].sort((a, b) => new Date(b.joined) - new Date(a.joined))
    return next
  }, [customers, search, status, sort])

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const pageItems = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleStatus = (c) => {
    const nextStatus = c.status === 'Active' ? 'Blocked' : 'Active'
    customerApi.updateStatus(c.id, nextStatus).then((updated) => {
      setCustomers((prev) => prev.map((x) => (x.id === c.id ? updated : x)))
      setViewing((v) => (v?.id === c.id ? updated : v))
      showToast(nextStatus === 'Blocked' ? `${c.name} blocked` : `${c.name} unblocked`, nextStatus === 'Blocked' ? 'error' : 'success')
    })
  }

  const customerOrders = (id) => ordersData.filter((o) => o.customerId === id)

  return (
    <div>
      <PageHeader title="Customer Management" subtitle="View and manage customers" />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2">
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }} className={`px-4 py-2 rounded-lg text-sm font-semibold ${status === s ? 'bg-primary-500 text-white' : 'bg-white border border-black/10 text-ink/60'}`}>
              {s} ({counts[s]})
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field !w-auto text-sm">
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search name, email, mobile..." className="input-field pl-10 !w-64" />
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th className="p-3.5">Customer</th><th className="p-3.5">Mobile</th><th className="p-3.5">Orders</th>
              <th className="p-3.5">Total Spent</th><th className="p-3.5">Joined</th><th className="p-3.5">Status</th><th className="p-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((c) => (
              <tr key={c.id} className="border-b border-black/5 last:border-0 hover:bg-primary-50/40">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">{c.name[0]}</div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-ink/40 truncate">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-ink/60">{c.mobile}</td>
                <td className="p-3 font-semibold">{c.orders}</td>
                <td className="p-3 font-semibold">{formatINR(c.totalSpent)}</td>
                <td className="p-3 text-ink/50">{formatDate(c.joined)}</td>
                <td className="p-3"><StatusPill status={c.status} /></td>
                <td className="p-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => setViewing(c)} className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-600"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => toggleStatus(c)} className={`p-1.5 rounded-lg ${c.status === 'Active' ? 'hover:bg-red-100 text-red-500' : 'hover:bg-leaf-100 text-leaf-600'}`}>
                      {c.status === 'Active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-ink/40">No customers match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
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
              <div className="bg-primary-50 rounded-xl p-3"><p className="text-lg font-extrabold font-display">{viewing.orders}</p><p className="text-[11px] text-ink/50 mt-0.5">Orders</p></div>
              <div className="bg-primary-50 rounded-xl p-3"><p className="text-lg font-extrabold font-display">{formatINR(viewing.totalSpent)}</p><p className="text-[11px] text-ink/50 mt-0.5">Total Spent</p></div>
              <div className="bg-primary-50 rounded-xl p-3"><p className="text-lg font-extrabold font-display">{formatDate(viewing.joined)}</p><p className="text-[11px] text-ink/50 mt-0.5">Joined</p></div>
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
                        <p className="font-semibold truncate">{o.riceName}</p>
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
