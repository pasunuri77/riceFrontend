import { useEffect, useMemo, useState } from 'react'
import { Wallet, CreditCard, Banknote, RotateCcw, Clock3, Eye, Package, User as UserIcon, MapPin } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import SearchInput from '../../components/ui/SearchInput'
import TableShell from '../../components/ui/TableShell'
import Pagination from '../../components/ui/Pagination'
import DashboardCard from '../../components/dashboard/DashboardCard'
import ExportMenu from '../../components/ui/ExportMenu'
import RowActionsMenu from '../../components/ui/RowActionsMenu'
import Drawer from '../../components/ui/Drawer'
import StatusPill from '../../components/ui/StatusPill'
import { formatUSD, formatDate } from '../../utils/format'
import { bagWeightLb } from '../../utils/stock'
import { exportToCsv, exportToExcel } from '../../utils/exportTable'
import orderApi from '../../api/orderApi'
import customerApi from '../../api/customerApi'
import { RowSkeleton } from '../../components/ui/Skeleton'

const itemsSummary = (o) => (o?.items?.length ? o.items.map((i) => i.name).join(', ') : o?.riceName)

// There's no dedicated Payment entity on the backend yet - every payment row
// here is derived 1:1 from an order's own paymentMethod/paymentStatus/amount
// fields (see backend prompt). Payment ID and "Payment Date" are therefore
// synthesized from the order, not real standalone records.
const METHOD_LABELS = { upi: 'UPI', card: 'Card', netbanking: 'Bank Transfer', cod: 'Cash' }
const isOnlineMethod = (method) => method !== 'cod'

function paymentFromOrder(o, mobileById) {
  return {
    id: `PAY-${o.id.replace(/\D/g, '')}`,
    orderId: o.id,
    customerId: o.customerId,
    customerName: o.customerName,
    customerMobile: mobileById[o.customerId] || '--',
    amount: o.amount,
    // The order's paymentMethod comes back as "CARD"/"COD" (uppercase) - the
    // labels/method-filter below are all keyed lowercase, so normalize once
    // here rather than at every lookup site.
    method: (o.paymentMethod || '').toLowerCase(),
    status: o.paymentStatus,
    date: o.date,
  }
}

function MethodCell({ method }) {
  const online = isOnlineMethod(method)
  return (
    <div>
      <span className={`badge ${online ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{online ? 'Online' : 'Cash'}</span>
      <p className="text-xs text-ink/40 mt-1">{METHOD_LABELS[method] || method || '--'}</p>
    </div>
  )
}

const PAGE_SIZE = 8

export default function AdminPayments() {
  const [ordersData, setOrdersData] = useState([])
  const [mobileById, setMobileById] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState(null)

  // The full order list is already loaded for this page (that's what payment
  // rows are derived from) - viewing an order just looks it up locally
  // instead of navigating to the Orders page and fetching it again there.
  const viewOrder = (orderId) => setViewing(ordersData.find((o) => o.id === orderId) || null)

  useEffect(() => {
    Promise.all([
      orderApi.listAll().then(setOrdersData).catch(() => setOrdersData([])),
      customerApi.list().then((list) => setMobileById(Object.fromEntries(list.map((c) => [c.id, c.mobile])))).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const payments = useMemo(() => ordersData.map((o) => paymentFromOrder(o, mobileById)), [ordersData, mobileById])

  const totals = useMemo(() => {
    const paid = payments.filter((p) => p.status === 'Paid')
    return {
      total: paid.reduce((s, p) => s + p.amount, 0),
      online: paid.filter((p) => isOnlineMethod(p.method)).reduce((s, p) => s + p.amount, 0),
      cash: paid.filter((p) => !isOnlineMethod(p.method)).reduce((s, p) => s + p.amount, 0),
      pending: payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0),
    }
  }, [payments])

  const filtered = useMemo(() => {
    let list = payments.filter((p) => `${p.id} ${p.orderId} ${p.customerName}`.toLowerCase().includes(search.toLowerCase()))
    if (methodFilter) list = list.filter((p) => p.method === methodFilter)
    if (statusFilter) list = list.filter((p) => p.status === statusFilter)
    if (dateFrom) list = list.filter((p) => new Date(p.date) >= new Date(dateFrom))
    if (dateTo) list = list.filter((p) => new Date(p.date) <= new Date(`${dateTo}T23:59:59`))
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [payments, search, methodFilter, statusFilter, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Native <input type="date"> can end up reporting a malformed value (a
  // year with more than 4 digits) if someone types quickly into the year
  // segment - the browser doesn't always block it. A valid value is always
  // exactly YYYY-MM-DD, so anything else (including empty, a valid
  // "cleared" state) is rejected here rather than stored.
  const makeDateHandler = (setter) => (e) => {
    const value = e.target.value
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return
    setter(value)
    setPage(1)
  }
  const handleDateFromChange = makeDateHandler(setDateFrom)
  const handleDateToChange = makeDateHandler(setDateTo)

  const exportColumns = [
    { label: 'Payment ID', value: (p) => p.id },
    { label: 'Order ID', value: (p) => p.orderId },
    { label: 'Customer', value: (p) => p.customerName },
    { label: 'Amount', value: (p) => p.amount },
    { label: 'Method', value: (p) => METHOD_LABELS[p.method] || p.method },
    { label: 'Status', value: (p) => p.status },
    { label: 'Date', value: (p) => p.date },
  ]

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Payments' }]} />
      <PageHeader title="Payments" subtitle="Payment records derived from orders" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <DashboardCard icon={Wallet} label="Total Payments" value={formatUSD(totals.total)} tint="primary" index={0} loading={loading} />
        <DashboardCard icon={CreditCard} label="Online Payments" value={formatUSD(totals.online)} tint="blue" index={1} loading={loading} />
        <DashboardCard icon={Banknote} label="Cash Payments" value={formatUSD(totals.cash)} tint="amber" index={2} loading={loading} />
        <DashboardCard icon={RotateCcw} label="Refunds" value={formatUSD(0)} tint="leaf" index={3} loading={loading} />
        <DashboardCard icon={Clock3} label="Pending Amount" value={formatUSD(totals.pending)} tint="red" index={4} loading={loading} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search by Order ID, Customer name, Payment ID..." className="max-w-sm" />
        <div className="flex items-center gap-1.5">
          <input type="date" value={dateFrom} onChange={handleDateFromChange} max="9999-12-31" className="input-field !w-auto text-sm" aria-label="From date" />
          <span className="text-ink/30 text-sm">-</span>
          <input type="date" value={dateTo} onChange={handleDateToChange} max="9999-12-31" className="input-field !w-auto text-sm" aria-label="To date" />
        </div>
        <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1) }} className="input-field !w-auto text-sm">
          <option value="">All Payment Methods</option>
          {Object.entries(METHOD_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input-field !w-auto text-sm">
          <option value="">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
        </select>
        <div className="ml-auto">
          <ExportMenu
            onExportCsv={() => exportToCsv('payments', exportColumns, filtered)}
            onExportExcel={() => exportToExcel('payments', exportColumns, filtered)}
          />
        </div>
      </div>

      <div>
          <TableShell minWidth="820px">
            <thead>
              <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
                <th scope="col" className="p-3.5 whitespace-nowrap">Payment ID</th>
                <th scope="col" className="p-3.5 whitespace-nowrap">Order ID</th>
                <th scope="col" className="p-3.5 whitespace-nowrap">Customer</th>
                <th scope="col" className="p-3.5 whitespace-nowrap">Amount</th>
                <th scope="col" className="p-3.5 whitespace-nowrap">Method</th>
                <th scope="col" className="p-3.5 whitespace-nowrap">Status</th>
                <th scope="col" className="p-3.5 whitespace-nowrap">Payment Date</th>
                <th scope="col" className="p-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} cols={8} />)
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-sm text-ink/40">No payments found.</td></tr>
              ) : pageItems.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-primary-50/40">
                  <td className="p-3 font-semibold whitespace-nowrap">{p.id}</td>
                  <td className="p-3 whitespace-nowrap"><button onClick={() => viewOrder(p.orderId)} className="text-primary-700 font-semibold hover:underline">{p.orderId}</button></td>
                  <td className="p-3 whitespace-nowrap">
                    <p className="font-semibold">{p.customerName}</p>
                    <p className="text-xs text-ink/40">{p.customerMobile}</p>
                  </td>
                  <td className="p-3 font-semibold whitespace-nowrap">{formatUSD(p.amount)}</td>
                  <td className="p-3 whitespace-nowrap"><MethodCell method={p.method} /></td>
                  <td className="p-3 whitespace-nowrap"><span className={`badge ${p.status === 'Paid' ? 'bg-leaf-100 text-leaf-700' : 'bg-orange-100 text-orange-700'}`}>{p.status}</span></td>
                  <td className="p-3 text-ink/50 whitespace-nowrap">{formatDate(p.date)}</td>
                  <td className="p-3">
                    <RowActionsMenu
                      id={`payment-${p.id}`}
                      label={`Actions for ${p.id}`}
                      items={[{ label: 'View Order', icon: Eye, onClick: () => viewOrder(p.orderId) }]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* Read-only view - Payments isn't the place to change an order's
          payment/delivery status (that's Admin Orders' job), just to see it
          without leaving this page. */}
      <Drawer open={!!viewing} onClose={() => setViewing(null)} title="Order Details" width="max-w-lg">
        {viewing && (
          <div className="p-5 space-y-5 text-sm">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-lg font-display">{viewing.id}</h4>
                <StatusPill status={viewing.deliveryStatus} />
              </div>
              <p className="text-ink/50 text-xs mt-1">{formatDate(viewing.date)}{viewing.deliveryStatus === 'Delivered' && viewing.deliveredAt ? ` • Delivered ${formatDate(viewing.deliveredAt)}` : ''}</p>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2 flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" /> Customer Information</h5>
              <div className="card p-3.5 space-y-1.5">
                <div className="flex justify-between"><span className="text-ink/50">Name</span><span className="font-semibold">{viewing.customerName}</span></div>
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
                <div className="flex justify-between"><span className="text-ink/50">Delivery</span><span className="font-semibold">{viewing.deliveryCharge > 0 ? formatUSD(viewing.deliveryCharge) : 'Free'}</span></div>
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
                <div className="flex justify-between"><span className="text-ink/50">Method</span><span className="font-semibold">{METHOD_LABELS[(viewing.paymentMethod || '').toLowerCase()] || viewing.paymentMethod || '--'}</span></div>
                <div className="flex justify-between items-center"><span className="text-ink/50">Status</span><StatusPill status={viewing.paymentStatus} /></div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
