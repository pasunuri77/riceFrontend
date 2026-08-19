import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, Plus, Printer, Download, Package, User as UserIcon, MapPin, CreditCard } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import { STATUS_STYLES } from '../../components/ui/StatusPill'
import Drawer from '../../components/ui/Drawer'
import RowActionsMenu from '../../components/ui/RowActionsMenu'
import SearchInput from '../../components/ui/SearchInput'
import TableShell from '../../components/ui/TableShell'
import SortableHeader from '../../components/ui/SortableHeader'
import ColumnVisibilityMenu from '../../components/ui/ColumnVisibilityMenu'
import ExportMenu from '../../components/ui/ExportMenu'
import Pagination from '../../components/ui/Pagination'
import { formatUSD, formatDate, estimatedDelivery } from '../../utils/format'
import { bagWeightLb } from '../../utils/stock'
import { exportToCsv, exportToExcel } from '../../utils/exportTable'
import { useToast } from '../../context/ToastContext'
import orderApi from '../../api/orderApi'
import { RowSkeleton } from '../../components/ui/Skeleton'

const itemsSummary = (o) => (o.items?.length ? o.items.map((i) => `${i.name} (${bagWeightLb(i.weight)}lb Bag x${i.qty})`).join(', ') : o.riceName)

// Not persisted as its own column everywhere yet - orders created before the
// Online/Offline distinction existed (or synced from an endpoint that hasn't
// been updated to return it) fall back to "online", since that's what every
// order was before this feature.
const orderTypeOf = (o) => o.orderType || 'online'

const PAYMENT_METHOD_LABELS = { upi: 'Digital Wallet', card: 'Credit / Debit Card', netbanking: 'Bank Transfer', cod: 'Cash on Delivery' }
const paymentMethodLabel = (o) => PAYMENT_METHOD_LABELS[o.paymentMethod] || o.paymentMethod || '--'

const PAYMENT_STATUSES = ['Pending', 'Paid']
const DELIVERY_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
// An offline (in-store/walk-in) order never ships anywhere - "Shipped" has no
// meaning for it, so it's dropped from the options an offline order can move
// through. Everything else (Processing/Delivered/Cancelled) still applies -
// "Delivered" reads fine as "handed over/completed" for a walk-in sale too.
const deliveryStatusOptionsFor = (order) => (orderTypeOf(order) === 'offline' ? DELIVERY_STATUSES.filter((s) => s !== 'Shipped') : DELIVERY_STATUSES)
const TYPE_TABS = ['All Orders', 'Online Orders', 'Offline Orders']
const typeForTab = { 'Online Orders': 'online', 'Offline Orders': 'offline' }
const PAGE_SIZE = 10

const COLUMNS = [
  { key: 'type', label: 'Type' },
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

function TypeBadge({ order }) {
  const online = orderTypeOf(order) === 'online'
  return (
    <span className={`badge ${online ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
      {online ? 'Online' : 'Offline'}
    </span>
  )
}

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

// A still-Pending order isn't ready for the normal Processing/Shipped/Delivered
// progression yet - it first needs an explicit admin decision. Rather than a
// separate "Confirm Order" button next to the dropdown, that decision lives
// inside the dropdown itself: Pending shows only "Confirm" (-> Processing) and
// "Cancel" (-> Cancelled) as next steps. Once confirmed, this renders the
// normal full-status StatusSelect for the rest of the order lifecycle.
function DeliverySelect({ order, updating, onStatusChange, onConfirm }) {
  if (order.deliveryStatus !== 'Pending') {
    return <StatusSelect value={order.deliveryStatus} options={deliveryStatusOptionsFor(order)} disabled={updating[`${order.id}:delivery`]} onChange={(status) => onStatusChange(order.id, status)} />
  }
  const busy = updating[`${order.id}:delivery`] || updating[`${order.id}:confirm`]
  return (
    <select
      value="Pending"
      onChange={(e) => {
        const action = e.target.value
        if (action === 'Confirm') onConfirm(order.id)
        else if (action === 'Cancel') onStatusChange(order.id, 'Cancelled')
      }}
      onClick={(e) => e.stopPropagation()}
      disabled={busy}
      className={`badge border-0 cursor-pointer pr-6 disabled:opacity-60 disabled:cursor-not-allowed ${STATUS_STYLES.Pending}`}
    >
      <option value="Pending">Pending</option>
      <option value="Confirm">Confirm</option>
      <option value="Cancel">Cancel</option>
    </select>
  )
}

// Opens a clean, invoice-only print view in a new tab and triggers the browser
// print dialog - "Download Invoice" points at the same view since the browser's
// own "Save as PDF" print destination covers that without a new PDF dependency.
function printInvoice(order) {
  const win = window.open('', '_blank')
  if (!win) return
  const rows = (order.items?.length ? order.items : [{ name: itemsSummary(order), weight: '', qty: 1 }])
    .map((i) => `<tr><td>${i.name}</td><td>${i.weight ? `${bagWeightLb(i.weight)} lb` : '--'}</td><td>${i.qty}</td><td>${formatUSD((i.pricePerKg || 0) * (i.weight || 0))}</td><td>${formatUSD((i.pricePerKg || 0) * (i.weight || 0) * (i.qty || 1))}</td></tr>`)
    .join('')
  win.document.write(`
    <html><head><title>Invoice ${order.id}</title>
    <style>
      body{font-family:Segoe UI,Arial,sans-serif;color:#111;padding:32px;max-width:640px;margin:auto}
      h1{font-size:20px;margin:0 0 4px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{text-align:left;padding:8px;border-bottom:1px solid #eee;font-size:13px}
      .totals td{border:none;padding:4px 8px}
      .muted{color:#666;font-size:13px}
    </style></head>
    <body>
      <h1>RiceBazaar - Invoice ${order.id}</h1>
      <p class="muted">${orderTypeOf(order) === 'online' ? 'Online Order' : 'Offline Order'} • ${formatDate(order.date)}</p>
      <p><strong>Customer:</strong> ${order.customerName || '--'}</p>
      <p><strong>Address:</strong> ${order.address || '--'}</p>
      <table><thead><tr><th>Product</th><th>Variant</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
      <table class="totals" style="margin-top:8px">
        <tr><td>Subtotal</td><td style="text-align:right">${formatUSD(order.subtotal)}</td></tr>
        ${order.discountAmount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${formatUSD(order.discountAmount)}</td></tr>` : ''}
        <tr><td>Delivery</td><td style="text-align:right">${order.deliveryCharge > 0 ? formatUSD(order.deliveryCharge) : 'Free'}</td></tr>
        <tr><td>Tax</td><td style="text-align:right">${formatUSD(order.tax)}</td></tr>
        <tr><td><strong>Total</strong></td><td style="text-align:right"><strong>${formatUSD(order.amount)}</strong></td></tr>
      </table>
      <p class="muted" style="margin-top:24px">Payment: ${paymentMethodLabel(order)} - ${order.paymentStatus}</p>
    </body></html>
  `)
  win.document.close()
  win.focus()
  win.print()
}

export default function AdminOrders() {
  const { showToast } = useToast()
  const [ordersData, setOrdersData] = useState([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('All Orders')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState(null)
  const [updating, setUpdating] = useState({})
  const [loading, setLoading] = useState(true)
  const [visibleCols, setVisibleCols] = useState({})
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    orderApi.listAll().then(setOrdersData).catch(() => setOrdersData([])).finally(() => setLoading(false))
  }, [])

  // Lets a notification (or any other link) deep-link straight into a specific
  // order's detail panel, e.g. /admin/orders?view=<id>, the same pattern already
  // used for customers via ?id=.
  useEffect(() => {
    const id = searchParams.get('view')
    if (!id || ordersData.length === 0) return
    const match = ordersData.find((o) => o.id === id)
    if (match) setViewing(match)
    setSearchParams({}, { replace: true })
  }, [searchParams, ordersData])

  const counts = useMemo(() => ({
    'All Orders': ordersData.length,
    'Online Orders': ordersData.filter((o) => orderTypeOf(o) === 'online').length,
    'Offline Orders': ordersData.filter((o) => orderTypeOf(o) === 'offline').length,
  }), [ordersData])

  const filtered = useMemo(() => {
    const typeFilter = typeForTab[tab]
    let list = ordersData.filter((o) => `${o.id} ${o.customerName} ${o.riceName}`.toLowerCase().includes(search.toLowerCase()))
    if (typeFilter) list = list.filter((o) => orderTypeOf(o) === typeFilter)
    if (paymentFilter) list = list.filter((o) => o.paymentStatus === paymentFilter)
    if (deliveryFilter) list = list.filter((o) => o.deliveryStatus === deliveryFilter)
    if (dateFrom) list = list.filter((o) => new Date(o.date) >= new Date(dateFrom))
    if (dateTo) list = list.filter((o) => new Date(o.date) <= new Date(`${dateTo}T23:59:59`))
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
  }, [ordersData, tab, search, paymentFilter, deliveryFilter, dateFrom, dateTo, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  const toggleCol = (key) => setVisibleCols((v) => ({ ...v, [key]: v[key] === false ? true : false }))
  // Estimated Delivery / Delivered On are shipping concepts that don't apply
  // to an offline (in-store/walk-in) order - hidden outright while looking at
  // the Offline Orders tab, since every row would just read "--" otherwise.
  const shippingColsRelevant = tab !== 'Offline Orders'
  const isVisible = (key) => {
    if ((key === 'estimatedDelivery' || key === 'deliveredOn') && !shippingColsRelevant) return false
    return visibleCols[key] !== false
  }

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

  const confirmOrder = async (id) => {
    const key = `${id}:confirm`
    setUpdating((prev) => ({ ...prev, [key]: true }))
    try {
      const updatedOrder = await orderApi.confirmOrder(id)
      replaceOrder(updatedOrder)
      showToast('Order confirmed - now Processing', 'success')
    } catch (err) {
      showToast(err.message || 'Unable to confirm order', 'error')
    } finally {
      setUpdating((prev) => ({ ...prev, [key]: false }))
    }
  }

  const exportColumns = [
    { label: 'Order ID', value: (o) => o.id },
    { label: 'Type', value: (o) => (orderTypeOf(o) === 'online' ? 'Online' : 'Offline') },
    { label: 'Customer', value: (o) => o.customerName },
    { label: 'Rice', value: (o) => itemsSummary(o) },
    { label: 'Qty', value: (o) => o.quantity },
    { label: 'Amount', value: (o) => o.amount },
    { label: 'Date', value: (o) => o.date },
    { label: 'Payment', value: (o) => o.paymentStatus },
    { label: 'Delivery', value: (o) => o.deliveryStatus },
  ]

  const colCount = 1 + COLUMNS.filter((c) => isVisible(c.key)).length + 1

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Orders' }]} />
      <PageHeader
        title="Order Management"
        subtitle={`${filtered.length} of ${ordersData.length} orders`}
        action={<Link to="/admin/orders/new?type=offline" className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add Offline Order</Link>}
      />

      <div className="flex gap-2 flex-wrap mb-4">
        {TYPE_TABS.map((t) => (
          <button key={t} onClick={() => { setTab(t); setPage(1) }} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === t ? 'bg-primary-500 text-white' : 'bg-white border border-black/10 text-ink/60'}`}>
            {t} <span className={tab === t ? 'text-white/80' : 'text-ink/40'}>{counts[t]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search by Order ID, Customer name or Phone..." className="max-w-sm" />
        <div className="flex items-center gap-1.5">
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="input-field !w-auto text-sm" aria-label="From date" />
          <span className="text-ink/30 text-sm">-</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="input-field !w-auto text-sm" aria-label="To date" />
        </div>
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

      <TableShell minWidth="1100px">
          <thead>
            <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              <th scope="col" className="p-3.5">Order ID</th>
              {isVisible('type') && <th scope="col" className="p-3.5">Type</th>}
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
              <tr key={o.id} className="border-b border-black/5 last:border-0 hover:bg-primary-50/40">
                <td className="p-3 font-semibold">{o.id}</td>
                {isVisible('type') && <td className="p-3"><TypeBadge order={o} /></td>}
                {isVisible('customer') && (
                  <td className="p-3">
                    <Link to={`/admin/customers?id=${o.customerId}`} className="font-semibold text-primary-700 hover:underline">{o.customerName}</Link>
                  </td>
                )}
                {isVisible('rice') && <td className="p-3 max-w-[220px] break-words">{itemsSummary(o)}</td>}
                {isVisible('qty') && <td className="p-3 text-ink/60">{o.quantity}</td>}
                {isVisible('amount') && <td className="p-3 font-semibold">{formatUSD(o.amount)}</td>}
                {isVisible('date') && <td className="p-3 text-ink/50">{formatDate(o.date)}</td>}
                {isVisible('estimatedDelivery') && (
                  <td className="p-3 text-ink/50">{orderTypeOf(o) === 'offline' || o.deliveryStatus === 'Cancelled' ? '--' : estimatedDelivery(4, o.date)}</td>
                )}
                {isVisible('deliveredOn') && <td className="p-3 text-ink/50">{o.deliveredAt ? formatDate(o.deliveredAt) : '--'}</td>}
                {isVisible('payment') && <td className="p-3"><StatusSelect value={o.paymentStatus} options={PAYMENT_STATUSES} disabled={updating[`${o.id}:payment`]} onChange={(status) => updatePaymentStatus(o.id, status)} /></td>}
                {isVisible('delivery') && <td className="p-3"><DeliverySelect order={o} updating={updating} onStatusChange={updateDeliveryStatus} onConfirm={confirmOrder} /></td>}
                <td className="p-3">
                  <RowActionsMenu
                    id={`order-${o.id}`}
                    label={`Actions for ${o.id}`}
                    items={[{ label: 'View Details', icon: Eye, onClick: () => setViewing(o) }]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
      </TableShell>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Drawer open={!!viewing} onClose={() => setViewing(null)} title="Order Details" width="max-w-lg">
        {viewing && (
          <div className="p-5 space-y-5 text-sm">
            <div className="flex items-center justify-between">
              <TypeBadge order={viewing} />
              <div className="flex gap-2">
                <button onClick={() => printInvoice(viewing)} className="btn-outline text-xs px-3 py-1.5"><Printer className="w-3.5 h-3.5" /> Print Invoice</button>
                <button onClick={() => printInvoice(viewing)} className="btn-outline text-xs px-3 py-1.5"><Download className="w-3.5 h-3.5" /> Download Invoice</button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-lg font-display">{viewing.id}</h4>
                <StatusSelect value={viewing.paymentStatus} options={PAYMENT_STATUSES} disabled={updating[`${viewing.id}:payment`]} onChange={(status) => updatePaymentStatus(viewing.id, status)} />
              </div>
              <p className="text-ink/50 text-xs mt-1">{formatDate(viewing.date)}{viewing.deliveryStatus === 'Delivered' && viewing.deliveredAt ? ` • Delivered ${formatDate(viewing.deliveredAt)}` : ''}</p>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2 flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" /> Customer Information</h5>
              <div className="card p-3.5 space-y-1.5">
                <div className="flex justify-between"><span className="text-ink/50">Name</span><Link to={`/admin/customers?id=${viewing.customerId}`} className="font-semibold text-primary-700 hover:underline">{viewing.customerName}</Link></div>
                <div className="flex justify-between items-start gap-3"><span className="text-ink/50 shrink-0 flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</span><span className="font-semibold text-right">{viewing.address || '--'}</span></div>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Order Items</h5>
              <div className="card divide-y divide-black/5">
                {(viewing.items?.length ? viewing.items : [{ name: itemsSummary(viewing), weight: '', qty: viewing.quantity, pricePerKg: 0 }]).map((i, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{i.name}</p>
                      <p className="text-xs text-ink/40">{i.weight ? `${bagWeightLb(i.weight)}lb Bag` : ''} {i.weight ? '•' : ''} Qty: {i.qty}</p>
                    </div>
                    <p className="font-bold shrink-0">{formatUSD((i.pricePerKg || 0) * (i.weight || 0) * (i.qty || 1))}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2">Order Summary</h5>
              <div className="card p-3.5 space-y-2">
                <div className="flex justify-between"><span className="text-ink/50">Subtotal</span><span className="font-semibold">{formatUSD(viewing.subtotal)}</span></div>
                {viewing.discountAmount > 0 && (
                  <div className="flex justify-between text-leaf-600"><span>Discount {viewing.couponCode && `(${viewing.couponCode})`}</span><span className="font-semibold">-{formatUSD(viewing.discountAmount)}</span></div>
                )}
                {orderTypeOf(viewing) === 'online' && (
                  <div className="flex justify-between"><span className="text-ink/50">Delivery</span><span className="font-semibold">{viewing.deliveryCharge > 0 ? formatUSD(viewing.deliveryCharge) : 'Free'}</span></div>
                )}
                <div className="flex justify-between"><span className="text-ink/50">Tax</span><span className="font-semibold">{formatUSD(viewing.tax)}</span></div>
                <div className="border-t border-black/10 pt-2 flex justify-between items-center">
                  <span className="font-bold">Total Amount</span>
                  <span className="font-extrabold text-lg text-primary-700">{formatUSD(viewing.amount)}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Payment</h5>
              <div className="card p-3.5 space-y-1.5">
                <div className="flex justify-between"><span className="text-ink/50">Method</span><span className="font-semibold">{paymentMethodLabel(viewing)}</span></div>
                <div className="flex justify-between items-center"><span className="text-ink/50">Status</span><StatusSelect value={viewing.paymentStatus} options={PAYMENT_STATUSES} disabled={updating[`${viewing.id}:payment`]} onChange={(status) => updatePaymentStatus(viewing.id, status)} /></div>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2">Delivery Status</h5>
              <DeliverySelect order={viewing} updating={updating} onStatusChange={updateDeliveryStatus} onConfirm={confirmOrder} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
