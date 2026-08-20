import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, PackageCheck, PackageOpen, RefreshCw, WalletCards, XCircle } from 'lucide-react'
import Breadcrumb from '../../components/ui/Breadcrumb'
import PageHeader from '../../components/ui/PageHeader'
import Drawer from '../../components/ui/Drawer'
import EmptyState from '../../components/ui/EmptyState'
import TableShell from '../../components/ui/TableShell'
import StatusPill from '../../components/ui/StatusPill'
import SearchInput from '../../components/ui/SearchInput'
import { RowSkeleton } from '../../components/ui/Skeleton'
import { formatDate, formatUSD } from '../../utils/format'
import { ApiError } from '../../api/client'
import returnApi from '../../api/returnApi'
import { normalizeReturnRequest, normalizeReturnRequests, returnStatusLabel, RETURN_STATUSES } from '../../data/returnRequests'
import { useToast } from '../../context/ToastContext'

const rejectReasons = ['Damage due to customer handling', 'Item is used', 'Return window expired', 'Policy conditions not met']
const itemSummary = (request) => request.items.map((item) => `${item.label} x${item.quantity}`).join(', ')

function RefundSummary({ request }) {
  return (
    <div className="card p-4 space-y-2">
      <h4 className="font-bold">Refund Summary</h4>
      {request.items.map((item) => (
        <div key={item.id} className="flex justify-between gap-3 text-sm">
          <span>{item.label}<span className="text-ink/45"> x {item.quantity}</span></span>
          <span className="font-semibold">{formatUSD(item.lineTotal)}</span>
        </div>
      ))}
      <div className="border-t border-black/10 pt-2 flex justify-between font-bold">
        <span>Refund Amount</span>
        <span className="text-leaf-700">{formatUSD(request.refundAmount)}</span>
      </div>
      <p className="text-xs text-ink/45">Delivery charges and tax are not included.</p>
    </div>
  )
}

export default function AdminReturns() {
  const { showToast } = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState(null)
  const [mode, setMode] = useState('details')
  const [saving, setSaving] = useState(false)
  const [rejectReason, setRejectReason] = useState(rejectReasons[0])
  const [adminNote, setAdminNote] = useState('The package appears to be torn from the side. As per our return policy, returns are not accepted for damage caused after delivery.')
  const [instructions, setInstructions] = useState('Please ship the item back within 7 days using the prepaid return label we will email you. Make sure to securely pack the item.')
  const [receivedCondition, setReceivedCondition] = useState('Original condition verified')
  const [receivedNote, setReceivedNote] = useState('Returned items received and checked by admin.')
  const [refundReference, setRefundReference] = useState('')
  const [refundNote, setRefundNote] = useState('Refund processed after returned items were received.')

  const loadRequests = () => {
    setLoading(true)
    returnApi.listAll()
      .then((data) => setRequests(normalizeReturnRequests(data)))
      .catch((err) => showToast(err instanceof ApiError ? err.message : 'Unable to load return requests', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadRequests() }, [])

  const filtered = useMemo(() => {
    const value = search.toLowerCase()
    return requests.filter((request) => `${request.returnNumber} ${request.orderDisplayId} ${request.customerName} ${itemSummary(request)}`.toLowerCase().includes(value))
  }, [requests, search])

  const replaceRequest = (updatedRaw) => {
    const updated = normalizeReturnRequest(updatedRaw)
    setRequests((current) => current.map((request) => (request.id === updated.id ? updated : request)))
    setViewing(updated)
    setMode('details')
  }

  const runAction = async (action, successMessage) => {
    setSaving(true)
    try {
      const updated = await action()
      replaceRequest(updated)
      showToast(successMessage, 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to update return request', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Returns' }]} />
      <PageHeader
        title="Return Requests"
        subtitle={`${filtered.length} return request${filtered.length === 1 ? '' : 's'}`}
        action={<button onClick={loadRequests} className="btn-outline text-sm"><RefreshCw className="w-4 h-4" /> Refresh</button>}
      />

      <div className="flex flex-wrap gap-3 items-center mb-4">
        {['All', RETURN_STATUSES.REQUESTED, RETURN_STATUSES.APPROVED, RETURN_STATUSES.RECEIVED, RETURN_STATUSES.REFUNDED, RETURN_STATUSES.REJECTED].map((status) => (
          <span key={status} className="badge bg-white border border-black/10 text-ink/55">
            {status === 'All' ? 'All' : returnStatusLabel(status)} {status === 'All' ? requests.length : requests.filter((request) => request.status === status).length}
          </span>
        ))}
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search returns..." className="max-w-sm ml-auto" />
      </div>

      <TableShell minWidth="960px">
        <thead>
          <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
            <th className="p-3.5 whitespace-nowrap">Return Request</th>
            <th className="p-3.5 whitespace-nowrap">Order ID</th>
            <th className="p-3.5 whitespace-nowrap">Customer</th>
            <th className="p-3.5 whitespace-nowrap">Items</th>
            <th className="p-3.5 whitespace-nowrap">Refund Amount</th>
            <th className="p-3.5 whitespace-nowrap">Status</th>
            <th className="p-3.5 whitespace-nowrap">Requested On</th>
            <th className="p-3.5"></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} cols={8} />)
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8} className="p-8"><EmptyState icon={PackageCheck} title="No return requests" subtitle="Submitted return requests will appear here." /></td></tr>
          ) : filtered.map((request) => (
            <tr key={request.id} className="border-b border-black/5 last:border-0 hover:bg-primary-50/40">
              <td className="p-3 font-semibold whitespace-nowrap">{request.returnNumber}</td>
              <td className="p-3 text-primary-700 font-semibold whitespace-nowrap">{request.orderDisplayId}</td>
              <td className="p-3 whitespace-nowrap">{request.customerName}</td>
              <td className="p-3 max-w-[240px] break-words">{itemSummary(request)}</td>
              <td className="p-3 font-semibold whitespace-nowrap">{formatUSD(request.refundAmount)}</td>
              <td className="p-3 whitespace-nowrap"><StatusPill status={returnStatusLabel(request.status)} /></td>
              <td className="p-3 text-ink/50 whitespace-nowrap">{request.requestedOn ? formatDate(request.requestedOn) : '--'}</td>
              <td className="p-3 text-right">
                <button onClick={() => { setViewing(request); setMode('details') }} className="btn bg-primary-50 text-primary-700 px-3 py-1.5 text-xs"><Eye className="w-3.5 h-3.5" /> View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>

      <Drawer open={!!viewing} onClose={() => setViewing(null)} title={mode === 'approve' ? 'Approve Return Request' : mode === 'reject' ? 'Reject Return Request' : mode === 'receive' ? 'Receive Return Items' : mode === 'refund' ? 'Process Refund' : 'Return Request Details'} width="max-w-2xl">
        {viewing && (
          <div className="p-5 space-y-5 text-sm">
            {mode === 'details' && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-ink/40">Request ID</p>
                    <h3 className="font-display font-extrabold text-xl">{viewing.returnNumber}</h3>
                  </div>
                  <StatusPill status={returnStatusLabel(viewing.status)} />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    ['Order ID', viewing.orderDisplayId],
                    ['Customer', viewing.customerName],
                    ['Order Date', viewing.orderDate ? formatDate(viewing.orderDate) : '--'],
                    ['Delivered Date', viewing.deliveredAt ? formatDate(viewing.deliveredAt) : '--'],
                    ['Payment Method', viewing.paymentDisplay],
                    ['Reason', viewing.reason],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-primary-50 p-3">
                      <p className="text-xs font-bold uppercase text-ink/40">{label}</p>
                      <p className="font-semibold mt-1">{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-bold mb-3">Items to Return</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {viewing.items.map((item) => (
                      <div key={item.id} className="rounded-lg border border-black/10 p-3">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-ink/55">{item.label}</p>
                        <div className="mt-3 space-y-1 text-xs text-ink/55">
                          <div className="flex justify-between"><span>Ordered quantity</span><span className="font-semibold text-ink">{item.orderedQuantity || '--'}</span></div>
                          <div className="flex justify-between"><span>Return quantity</span><span className="font-semibold text-ink">{item.quantity}</span></div>
                          <div className="flex justify-between"><span>Unit price</span><span className="font-semibold text-ink">{formatUSD(item.unitPrice)}</span></div>
                          <div className="flex justify-between"><span>Refund</span><span className="font-semibold text-leaf-700">{formatUSD(item.lineTotal)}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <RefundSummary request={viewing} />

                {(viewing.receivedAt || viewing.refundedAt) && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {viewing.receivedAt && <div className="card p-4"><p className="text-xs font-bold uppercase text-ink/40">Return received</p><p className="font-semibold mt-1">{formatDate(viewing.receivedAt)}</p><p className="text-xs text-ink/55 mt-1">{viewing.receivedCondition}</p></div>}
                    {viewing.refundedAt && <div className="card p-4"><p className="text-xs font-bold uppercase text-ink/40">Refund processed</p><p className="font-semibold mt-1">{formatUSD(viewing.refundAmount)}</p><p className="text-xs text-ink/55 mt-1">{viewing.refundReference || '--'}</p></div>}
                  </div>
                )}

                <div className="card p-4">
                  <h4 className="font-bold mb-2">Customer Details</h4>
                  <p className="text-ink/65">{viewing.details || 'No extra details provided.'}</p>
                </div>

                {viewing.status === RETURN_STATUSES.REQUESTED && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button onClick={() => setMode('reject')} className="btn border border-red-200 text-red-600 bg-white px-4 py-2.5"><XCircle className="w-4 h-4" /> Reject Request</button>
                    <button onClick={() => setMode('approve')} className="btn bg-leaf-600 text-white px-4 py-2.5"><CheckCircle2 className="w-4 h-4" /> Approve Request</button>
                  </div>
                )}
                {viewing.status === RETURN_STATUSES.APPROVED && <button onClick={() => setMode('receive')} className="btn bg-primary-500 text-white w-full py-2.5"><PackageOpen className="w-4 h-4" /> Mark Return Items Received</button>}
                {viewing.status === RETURN_STATUSES.RECEIVED && <button onClick={() => setMode('refund')} className="btn bg-leaf-600 text-white w-full py-2.5"><WalletCards className="w-4 h-4" /> Process Refund</button>}
              </>
            )}

            {mode === 'approve' && (
              <>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-blue-700">The customer will receive return instructions after approval.</div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="card p-4"><p className="text-xs text-ink/45">Refund method</p><p className="font-bold">{viewing.paymentDisplay}</p></div>
                  <div className="card p-4"><p className="text-xs text-ink/45">Refund amount</p><p className="font-bold text-leaf-700">{formatUSD(viewing.refundAmount)}</p></div>
                </div>
                <label className="label-field" htmlFor="return-instructions">Return instructions for customer</label>
                <textarea id="return-instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={5} className="input-field resize-none" />
                <button disabled={saving} onClick={() => runAction(() => returnApi.approve(viewing.id, { adminNote: 'Approved for return.', returnInstructions: instructions }), 'Return request approved')} className="btn bg-leaf-600 text-white w-full py-2.5 disabled:opacity-60"><CheckCircle2 className="w-4 h-4" /> {saving ? 'Approving...' : 'Approve Request'}</button>
              </>
            )}

            {mode === 'reject' && (
              <>
                <label className="label-field" htmlFor="reject-reason">Reason for rejection</label>
                <select id="reject-reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="input-field">
                  {rejectReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                </select>
                <label className="label-field" htmlFor="admin-note">Add a note</label>
                <textarea id="admin-note" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={5} className="input-field resize-none" />
                <button disabled={saving} onClick={() => runAction(() => returnApi.reject(viewing.id, { reason: rejectReason, adminNote }), 'Return request rejected')} className="btn bg-red-600 text-white w-full py-2.5 disabled:opacity-60"><XCircle className="w-4 h-4" /> {saving ? 'Rejecting...' : 'Reject Request'}</button>
              </>
            )}

            {mode === 'receive' && (
              <>
                <div className="rounded-lg border border-primary-100 bg-primary-50 p-3 text-primary-700">Use this after the returned items physically arrive and have been inspected.</div>
                <RefundSummary request={viewing} />
                <label className="label-field" htmlFor="received-condition">Received item condition</label>
                <select id="received-condition" value={receivedCondition} onChange={(e) => setReceivedCondition(e.target.value)} className="input-field">
                  <option>Original condition verified</option>
                  <option>Package damaged but item acceptable</option>
                  <option>Quantity mismatch</option>
                  <option>Needs manual review</option>
                </select>
                <label className="label-field" htmlFor="received-note">Receiving note</label>
                <textarea id="received-note" value={receivedNote} onChange={(e) => setReceivedNote(e.target.value)} rows={4} className="input-field resize-none" />
                <button disabled={saving} onClick={() => runAction(() => returnApi.receive(viewing.id, { receivedCondition, receivedNote }), 'Return items received')} className="btn bg-primary-500 text-white w-full py-2.5 disabled:opacity-60"><PackageOpen className="w-4 h-4" /> {saving ? 'Saving...' : 'Confirm Items Received'}</button>
              </>
            )}

            {mode === 'refund' && (
              <>
                <div className="rounded-lg border border-leaf-100 bg-leaf-50 p-3 text-leaf-700">Process the refund after received items pass inspection.</div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="card p-4"><p className="text-xs text-ink/45">Refund method</p><p className="font-bold">{viewing.paymentDisplay}</p></div>
                  <div className="card p-4"><p className="text-xs text-ink/45">Refund amount</p><p className="font-bold text-leaf-700">{formatUSD(viewing.refundAmount)}</p></div>
                </div>
                <label className="label-field" htmlFor="refund-reference">Refund reference</label>
                <input id="refund-reference" value={refundReference} onChange={(e) => setRefundReference(e.target.value)} placeholder="Optional, e.g. PSP transaction ID" className="input-field" />
                <label className="label-field" htmlFor="refund-note">Refund note</label>
                <textarea id="refund-note" value={refundNote} onChange={(e) => setRefundNote(e.target.value)} rows={4} className="input-field resize-none" />
                <button disabled={saving} onClick={() => runAction(() => returnApi.refund(viewing.id, { refundReference, refundNote }), 'Refund processed')} className="btn bg-leaf-600 text-white w-full py-2.5 disabled:opacity-60"><WalletCards className="w-4 h-4" /> {saving ? 'Processing...' : 'Mark Refund Processed'}</button>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
