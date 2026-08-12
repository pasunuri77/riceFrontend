import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, Truck } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import { STATUS_STYLES } from '../../components/ui/StatusPill'
import Modal from '../../components/ui/Modal'
import SearchInput from '../../components/ui/SearchInput'
import TableShell from '../../components/ui/TableShell'
import SortableHeader from '../../components/ui/SortableHeader'
import ColumnVisibilityMenu from '../../components/ui/ColumnVisibilityMenu'
import ExportMenu from '../../components/ui/ExportMenu'
import BulkActionsBar from '../../components/ui/BulkActionsBar'
import Pagination from '../../components/ui/Pagination'
import { formatINR, formatDate, estimatedDelivery } from '../../utils/format'
import { exportToCsv, exportToExcel } from '../../utils/exportTable'
import { useToast } from '../../context/ToastContext'
import orderApi from '../../api/orderApi'
import { RowSkeleton } from '../../components/ui/Skeleton'

const itemsSummary = (o) => (o.items?.length ? o.items.map((i) => `${i.name} (${i.weight}kg Bag x${i.qty})`).join(', ') : o.riceName)

const PAYMENT_STATUSES = ['Pending', 'Paid']
const DELIVERY_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const PAGE_SIZE = 10

const COLUMNS = [
  { key: 'customer', label: 'Customer' },
  { key: 'rice', label: 'Rice' },
  { key: 'qty', label: 'Qty' },
  { key: 'amount', label: 'Amount', sortField: 'amount' },
  { key: 'date', label: 'Ordered On', sortField: 'date' },
  { key: 'estimatedDelivery', label: 'Estimated Delivery' },
  // The backend has no `deliveredAt` timestamp yet, so this column always reads
  // "--" for now - it's wired up honestly rather than faked, ready to populate
  // the moment that field exists.
  { key: 'deliveredOn', label: 'Delivered On' },
  { key: 'payment', label: 'Payment' },
  { key: 'delivery', label: 'Delivery' },
]

function StatusSelect({ value, options, onChange, disabled = false }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
      className={`badge border-0 cursor-pointer pr-6 disabled:opacity-60 disabled:cursor-not-allowed ${STATUS_STYLES[value] || 'bg-black/10 text-ink/60'}`}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export default function AdminOrders() {
  const { showToast } = useToast()
  const [ordersData, setOrdersData] = useState([])
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState(null)
  const [updating, setUpdating] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [visibleCols, setVisibleCols] = useState({})
  const [bulkStatus, setBulkStatus] = useState(DELIVERY_STATUSES[0])
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    orderApi.listAll().then(setOrdersData).catch(() => setOrdersData([])).finally(() => setLoading(false))
  }, [])

  // Lets a notification (or any other link) deep-link straight into a specific
  // order's detail modal, e.g. /admin/orders?view=<id>, the same pattern already
  // used for customers via ?id=.
  useEffect(() => {
    const id = searchParams.get('view')
    if (!id || ordersData.length === 0) return
    const match = ordersData.find((o) => o.id === id)
    if (match) setViewing(match)
    setSearchParams({}, { replace: true })
  }, [searchParams, ordersData])

  const filtered = useMemo(() => {
    let list = ordersData.filter((o) => `${o.id} ${o.customerName} ${o.riceName}`.toLowerCase().includes(search.toLowerCase()))
    if (paymentFilter) list = list.filter((o) => o.paymentStatus === paymentFilter)
    if (deliveryFilter) list = list.filter((o) => o.deliveryStatus === deliveryFilter)
    if (sort.key) {
      const field = COLUMNS.find((c) => c.key === sort.key)?.sortField
      list = [...list].sort((a, b) => {
        let av = a[field]; let bv = b[field]
        if (av < bv) return sort.dir === 'asc' ? -1 : 1
        if (av > bv) return sort.dir === 'asc' ? 1 : -1
        return 0
      })
    }
    return list
  }, [ordersData, search, paymentFilter, deliveryFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  const toggleCol = (key) => setVisibleCols((v) => ({ ...v, [key]: v[key] === false ? true : false }))
  const isVisible = (key) => visibleCols[key] !== false

  const toggleSelect = (id) => setSelected((s) => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next })
  const toggleSelectPage = () => setSelected((s) => {
    const allSelected = pageItems.every((o) => s.has(o.id))
    const next = new Set(s)
    pageItems.forEach((o) => (allSelected ? next.delete(o.id) : next.add(o.id)))
    return next
  })
  const clearSelection = () => setSelected(new Set())

  const replaceOrder = (updatedOrder) => {
    setOrdersData((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)))
    setViewing((v) => (v?.id === updatedOrder.id ? updatedOrder : v))
  }

  const updatePaymentStatus = async (id, status) => {
    const key = `${id}:payment`
    setUpdating((prev) => ({ ...prev, [key]: true }))
    try {
      const updatedOrder = await orderApi.updatePaymentStatus(id, status)
      replaceOrder(updatedOrder)
      showToast('Payment status updated', 'success')
    } catch (err) {
      showToast(err.message || 'Unable to update payment status', 'error')
    } finally {
      setUpdating((prev) => ({ ...prev, [key]: false }))
    }
  }

  const updateDeliveryStatus = async (id, status) => {
    const key = `${id}:delivery`
    setUpdating((prev) => ({ ...prev, [key]: true }))
    try {
      const updatedOrder = await orderApi.updateDeliveryStatus(id, status)
      replaceOrder(updatedOrder)
      showToast('Delivery status updated', 'success')
    } catch (err) {
      showToast(err.message || 'Unable to update delivery status', 'error')
    } finally {
      setUpdating((prev) => ({ ...prev, [key]: false }))
    }
  }

  // No bulk-delete endpoint exists for orders, so the bulk action reuses the
  // real per-order delivery-status endpoint instead of fabricating a delete.
  const handleBulkStatusUpdate = () => {
    setBulkUpdating(true)
    Promise.allSettled([...selected].map((id) => orderApi.updateDeliveryStatus(id, bulkStatus)))
      .then((results) => {
        results.forEach((r) => { if (r.status === 'fulfilled') replaceOrder(r.value) })
        const failed = results.filter((r) => r.status === 'rejected').length
        clearSelection()
        if (failed > 0) showToast(`${results.length - failed} updated, ${failed} failed`, 'error')
        else showToast(`${results.length} order(s) marked ${bulkStatus}`, 'success')
      })
      .finally(() => setBulkUpdating(false))
  }

  const exportColumns = [
    { label: 'Order ID', value: (o) => o.id },
    { label: 'Customer', value: (o) => o.customerName },
    { label: 'Rice', value: (o) => itemsSummary(o) },
    { label: 'Qty', value: (o) => o.quantity },
    { label: 'Amount', value: (o) => o.amount },
    { label: 'Date', value: (o) => o.date },
    { label: 'Payment', value: (o) => o.paymentStatus },
    { label: 'Delivery', value: (o) => o.deliveryStatus },
  ]

  const colCount = 2 + COLUMNS.filter((c) => isVisible(c.key)).length + 1

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Orders' }]} />
      <PageHeader title="Order Management" subtitle={`${filtered.length} of ${ordersData.length} orders`} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search orders..." className="max-w-sm" />
        <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }} className="input-field !w-auto text-sm">
          <option value="">All Payments</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={deliveryFilter} onChange={(e) => { setDeliveryFilter(e.target.value); setPage(1) }} className="input-field !w-auto text-sm">
          <option value="">All Delivery Statuses</option>
          {DELIVERY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <ColumnVisibilityMenu columns={COLUMNS} visible={visibleCols} onToggle={toggleCol} />
          <ExportMenu
            onExportCsv={() => exportToCsv('orders', exportColumns, filtered)}
            onExportExcel={() => exportToExcel('orders', exportColumns, filtered)}
          />
        </div>
      </div>

      <BulkActionsBar count={selected.size} onClear={clearSelection}>
        <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="input-field !w-auto text-xs py-1.5">
          {DELIVERY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={handleBulkStatusUpdate} disabled={bulkUpdating} className="btn text-xs px-3 py-1.5 bg-primary-500 text-white disabled:opacity-60">
          <Truck className="w-3.5 h-3.5" /> {bulkUpdating ? 'Updating...' : 'Mark as Selected Status'}
        </button>
      </BulkActionsBar>

      <TableShell minWidth="1040px">
          <thead>
            <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th scope="col" className="p-3.5 w-10">
                <input type="checkbox" aria-label="Select all orders on this page" className="accent-primary-500 w-4 h-4" checked={pageItems.length > 0 && pageItems.every((o) => selected.has(o.id))} onChange={toggleSelectPage} />
              </th>
              <th scope="col" className="p-3.5">Order ID</th>
              {isVisible('customer') && <th scope="col" className="p-3.5">Customer</th>}
              {isVisible('rice') && <th scope="col" className="p-3.5">Rice</th>}
              {isVisible('qty') && <th scope="col" className="p-3.5">Qty</th>}
              {isVisible('amount') && <SortableHeader label="Amount" sortKey="amount" sort={sort} onSort={toggleSort} />}
              {isVisible('date') && <SortableHeader label="Ordered On" sortKey="date" sort={sort} onSort={toggleSort} />}
              {isVisible('estimatedDelivery') && <th scope="col" className="p-3.5">Estimated Delivery</th>}
              {isVisible('deliveredOn') && <th scope="col" className="p-3.5">Delivered On</th>}
              {isVisible('payment') && <th scope="col" className="p-3.5">Payment</th>}
              {isVisible('delivery') && <th scope="col" className="p-3.5">Delivery</th>}
              <th scope="col" className="p-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} cols={colCount} />)
            ) : pageItems.length === 0 ? (
              <tr><td colSpan={colCount} className="p-8 text-center text-sm text-ink/40">No orders found.</td></tr>
            ) : pageItems.map((o) => (
              <tr key={o.id} className={`border-b border-black/5 last:border-0 hover:bg-primary-50/40 ${selected.has(o.id) ? 'bg-primary-50/60' : ''}`}>
                <td className="p-3"><input type="checkbox" aria-label={`Select order ${o.id}`} className="accent-primary-500 w-4 h-4" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} /></td>
                <td className="p-3 font-semibold">{o.id}</td>
                {isVisible('customer') && (
                  <td className="p-3">
                    <Link to={`/admin/customers?id=${o.customerId}`} className="font-semibold text-primary-700 hover:underline">{o.customerName}</Link>
                  </td>
                )}
                {isVisible('rice') && <td className="p-3 max-w-[220px] break-words">{itemsSummary(o)}</td>}
                {isVisible('qty') && <td className="p-3 text-ink/60">{o.quantity}</td>}
                {isVisible('amount') && <td className="p-3 font-semibold">{formatINR(o.amount)}</td>}
                {isVisible('date') && <td className="p-3 text-ink/50">{formatDate(o.date)}</td>}
                {isVisible('estimatedDelivery') && (
                  <td className="p-3 text-ink/50">{o.deliveryStatus === 'Cancelled' ? '--' : estimatedDelivery(4, o.date)}</td>
                )}
                {/* No `deliveredAt` field exists on the backend yet - this column is a placeholder awaiting that data, never a guessed value. */}
                {isVisible('deliveredOn') && <td className="p-3 text-ink/50">--</td>}
                {isVisible('payment') && <td className="p-3"><StatusSelect value={o.paymentStatus} options={PAYMENT_STATUSES} disabled={updating[`${o.id}:payment`]} onChange={(status) => updatePaymentStatus(o.id, status)} /></td>}
                {isVisible('delivery') && <td className="p-3"><StatusSelect value={o.deliveryStatus} options={DELIVERY_STATUSES} disabled={updating[`${o.id}:delivery`]} onChange={(status) => updateDeliveryStatus(o.id, status)} /></td>}
                <td className="p-3"><button onClick={() => setViewing(o)} aria-label={`View order ${o.id}`} className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-600"><Eye className="w-4 h-4" aria-hidden="true" /></button></td>
              </tr>
            ))}
          </tbody>
      </TableShell>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.id}>
        {viewing && (
          <div className="space-y-3 text-sm">
            {viewing.productId ? (
              <Link to={`/products/${viewing.productId}`}>
                <img src={viewing.image} alt="" className="w-full h-40 object-cover rounded-xl mb-2 hover:opacity-90 transition" />
              </Link>
            ) : (
              <img src={viewing.image} alt="" className="w-full h-40 object-cover rounded-xl mb-2" />
            )}
            <div className="flex justify-between"><span className="text-ink/50">Customer</span><Link to={`/admin/customers?id=${viewing.customerId}`} className="font-semibold text-primary-700 hover:underline">{viewing.customerName}</Link></div>
            <div className="flex justify-between"><span className="text-ink/50">Rice</span><span className="font-semibold text-right max-w-[60%]">{itemsSummary(viewing)}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Address</span><span className="font-semibold text-right max-w-[60%]">{viewing.address}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Amount</span><span className="font-semibold">{formatINR(viewing.amount)}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Order Date</span><span className="font-semibold">{formatDate(viewing.date)}</span></div>
            {viewing.deliveryStatus !== 'Cancelled' && (
              <div className="flex justify-between"><span className="text-ink/50">Estimated Delivery</span><span className="font-semibold">{estimatedDelivery(4, viewing.date)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-ink/50">Delivered On</span><span className="font-semibold">--</span></div>
            <div className="flex justify-between items-center"><span className="text-ink/50">Payment Status</span><StatusSelect value={viewing.paymentStatus} options={PAYMENT_STATUSES} disabled={updating[`${viewing.id}:payment`]} onChange={(status) => updatePaymentStatus(viewing.id, status)} /></div>
            <div className="flex justify-between items-center"><span className="text-ink/50">Delivery Status</span><StatusSelect value={viewing.deliveryStatus} options={DELIVERY_STATUSES} disabled={updating[`${viewing.id}:delivery`]} onChange={(status) => updateDeliveryStatus(viewing.id, status)} /></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
