import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Plus, Package, Camera, User as UserIcon, UserPlus, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import StatusPill from '../../components/ui/StatusPill'
import TableShell from '../../components/ui/TableShell'
import Drawer from '../../components/ui/Drawer'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { RowSkeleton } from '../../components/ui/Skeleton'
import { formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import deliveryRunApi from '../../api/deliveryRunApi'
import orderApi from '../../api/orderApi'
import staffApi from '../../api/staffApi'

const RUN_STATUS_LABEL = { PENDING: 'Pending', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }

// Orders that make sense to batch into a delivery run - online, not yet
// delivered/cancelled, and not already sitting in another run.
const isAssignable = (o) => (o.orderType || 'online') === 'online' && ['Pending', 'Processing', 'Shipped'].includes(o.deliveryStatus) && !o.deliveryRunId

function CreateRunModal({ open, onClose, onCreated }) {
  const { showToast } = useToast()
  const [drivers, setDrivers] = useState([])
  const [driversError, setDriversError] = useState(false)
  const [orders, setOrders] = useState([])
  const [driverId, setDriverId] = useState('')
  const [vehicleInfo, setVehicleInfo] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setDriverId(''); setVehicleInfo(''); setNotes(''); setSelectedOrderIds([]); setDriversError(false)
    deliveryRunApi.listDeliveryPartners().then(setDrivers).catch(() => { setDrivers([]); setDriversError(true) })
    orderApi.listAll().then((data) => setOrders(data.filter(isAssignable))).catch(() => setOrders([]))
  }, [open])

  const toggleOrder = (id) => setSelectedOrderIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const submit = async () => {
    if (!driverId) { showToast('Select a delivery partner', 'error'); return }
    if (selectedOrderIds.length === 0) { showToast('Select at least one order to assign', 'error'); return }
    setSubmitting(true)
    try {
      const run = await deliveryRunApi.create({ driverId: Number(driverId), vehicleInfo: vehicleInfo.trim(), notes: notes.trim(), orderIds: selectedOrderIds })
      showToast(`Delivery run ${run.runNumber} created`, 'success')
      onCreated()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to create delivery run', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Delivery Run" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="label-field" htmlFor="run-driver">Delivery Partner</label>
          <select id="run-driver" value={driverId} onChange={(e) => setDriverId(e.target.value)} className="input-field">
            <option value="">Select a delivery partner...</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name} {d.email ? `(${d.email})` : ''}</option>)}
          </select>
          {driversError && (
            <p className="text-xs text-amber-600 mt-1">
              Couldn't load delivery partners - the backend endpoint for listing them isn't available yet.
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label-field" htmlFor="run-vehicle">Vehicle Info (Optional)</label>
            <input id="run-vehicle" value={vehicleInfo} onChange={(e) => setVehicleInfo(e.target.value)} placeholder="e.g. Bike - TX 1234" className="input-field" />
          </div>
          <div>
            <label className="label-field" htmlFor="run-notes">Notes (Optional)</label>
            <input id="run-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" />
          </div>
        </div>

        <div>
          <p className="label-field">Assign Orders ({selectedOrderIds.length} selected)</p>
          <div className="card max-h-64 overflow-y-auto divide-y divide-black/5">
            {orders.length === 0 ? (
              <p className="p-3.5 text-sm text-ink/40">No unassigned online orders are currently eligible for a delivery run.</p>
            ) : orders.map((o) => (
              <label key={o.id} className="flex items-center gap-2.5 p-3 cursor-pointer hover:bg-primary-50/40">
                <input type="checkbox" checked={selectedOrderIds.includes(o.id)} onChange={() => toggleOrder(o.id)} className="accent-primary-500 w-4 h-4" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{o.id} <span className="text-ink/40 font-normal">&middot; {o.customerName}</span></p>
                  <p className="text-xs text-ink/40 truncate">{o.address}</p>
                </div>
                <StatusPill status={o.deliveryStatus} />
              </label>
            ))}
          </div>
        </div>

        <button onClick={submit} disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-60">
          {submitting ? 'Creating...' : 'Create Delivery Run'}
        </button>
      </div>
    </Modal>
  )
}

// Reuses the existing staff-invite endpoint (POST /api/admin/staff/invite) -
// it already accepts any role by name, including "delivery_partner", it's
// just never been offered as an option in the Customers & Staff invite form
// (which is scoped to admin/employee only, per its own listing query). A
// delivery partner needs the same password-setup email an invited employee
// gets, not a separate account-creation flow.
function InviteDeliveryPartnerModal({ open, onClose, onInvited }) {
  const { showToast } = useToast()
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) { setFullName(''); setMobile(''); setEmail('') }
  }, [open])

  const submit = async () => {
    if (!fullName.trim() || !email.trim()) { showToast('Name and email are required', 'error'); return }
    setSubmitting(true)
    try {
      await staffApi.invite({ fullName: fullName.trim(), mobile: mobile.trim(), email: email.trim(), role: 'delivery_partner' })
      showToast('Invitation sent', 'success')
      onInvited()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to send invitation', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite Delivery Partner">
      <div className="space-y-3">
        <div className="flex items-start gap-2.5 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
          <UserPlus className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
          <p className="text-xs text-ink/60">An invitation email will be sent with a secure link to set up their password.</p>
        </div>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="input-field" />
        <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} type="tel" inputMode="numeric" maxLength={10} placeholder="Mobile number" className="input-field" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="input-field" />
        <button onClick={submit} disabled={submitting} className="btn-primary w-full disabled:opacity-60">
          {submitting ? 'Sending...' : 'Send Invite'}
        </button>
      </div>
    </Modal>
  )
}

export default function AdminDeliveryRuns() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)
  const [viewingLoading, setViewingLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  const load = () => {
    setLoading(true)
    deliveryRunApi.list().then(setRuns).catch(() => setRuns([])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openRun = (run) => {
    setViewing(run)
    setViewingLoading(true)
    deliveryRunApi.getById(run.id).then(setViewing).catch(() => {}).finally(() => setViewingLoading(false))
  }

  const totals = useMemo(() => ({
    runs: runs.length,
    assigned: runs.reduce((s, r) => s + (r.assignedCount || 0), 0),
    delivered: runs.reduce((s, r) => s + (r.deliveredCount || 0), 0),
  }), [runs])

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Delivery Runs' }]} />
      <PageHeader
        title="Delivery Runs"
        subtitle={`${totals.runs} runs · ${totals.delivered} of ${totals.assigned} orders delivered`}
        action={
          <div className="flex gap-2">
            <button onClick={() => setInviteOpen(true)} className="btn-outline text-sm"><UserPlus className="w-4 h-4" /> Invite Delivery Partner</button>
            <button onClick={() => setCreateOpen(true)} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Create Delivery Run</button>
          </div>
        }
      />

      <TableShell minWidth="900px">
        <thead>
          <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
            <th className="p-3.5 whitespace-nowrap">Run</th>
            <th className="p-3.5 whitespace-nowrap">Driver</th>
            <th className="p-3.5 whitespace-nowrap">Vehicle</th>
            <th className="p-3.5 whitespace-nowrap">Status</th>
            <th className="p-3.5 whitespace-nowrap">Assigned</th>
            <th className="p-3.5 whitespace-nowrap">Delivered</th>
            <th className="p-3.5 whitespace-nowrap">Proof Uploaded</th>
            <th className="p-3.5 whitespace-nowrap">Created</th>
            <th className="p-3.5"></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} cols={9} />)
          ) : runs.length === 0 ? (
            <tr><td colSpan={9} className="p-8"><EmptyState icon={Truck} title="No delivery runs yet" subtitle="Create a run to batch-assign orders to a delivery partner." /></td></tr>
          ) : runs.map((run) => (
            <tr key={run.id} className="border-b border-black/5 last:border-0 hover:bg-primary-50/40 cursor-pointer" onClick={() => openRun(run)}>
              <td className="p-3 font-semibold whitespace-nowrap">{run.runNumber}</td>
              <td className="p-3 whitespace-nowrap">{run.driverName || '--'}</td>
              <td className="p-3 whitespace-nowrap text-ink/60">{run.vehicleInfo || '--'}</td>
              <td className="p-3 whitespace-nowrap"><StatusPill status={RUN_STATUS_LABEL[run.status] || run.status} /></td>
              <td className="p-3 whitespace-nowrap">{run.assignedCount ?? 0}</td>
              <td className="p-3 whitespace-nowrap">{run.deliveredCount ?? 0}</td>
              <td className="p-3 whitespace-nowrap">{run.proofUploadedCount ?? 0} / {run.assignedCount ?? 0}</td>
              <td className="p-3 whitespace-nowrap text-ink/50">{run.createdAt ? formatDate(run.createdAt) : '--'}</td>
              <td className="p-3"></td>
            </tr>
          ))}
        </tbody>
      </TableShell>

      <Drawer open={!!viewing} onClose={() => setViewing(null)} title="Delivery Run" width="max-w-xl">
        {viewing && (
          <div className="p-5 space-y-5 text-sm">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-lg font-display">{viewing.runNumber}</h4>
                <StatusPill status={RUN_STATUS_LABEL[viewing.status] || viewing.status} />
              </div>
              <p className="text-ink/50 text-xs mt-1 flex items-center gap-1"><UserIcon className="w-3 h-3" /> {viewing.driverName || '--'}{viewing.vehicleInfo ? ` · ${viewing.vehicleInfo}` : ''}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 text-center">
                <p className="text-xl font-extrabold">{viewing.assignedCount ?? 0}</p>
                <p className="text-[11px] text-ink/50 mt-0.5">Assigned</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-xl font-extrabold text-leaf-700">{viewing.deliveredCount ?? 0}</p>
                <p className="text-[11px] text-ink/50 mt-0.5">Delivered</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-xl font-extrabold text-primary-700">{viewing.proofUploadedCount ?? 0}</p>
                <p className="text-[11px] text-ink/50 mt-0.5">Proofs Uploaded</p>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-2 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Orders in this Run</h5>
              {viewingLoading ? (
                <p className="text-ink/40 text-sm">Loading...</p>
              ) : (
                <div className="card divide-y divide-black/5 max-h-[50vh] overflow-y-auto">
                  {(viewing.orders || []).map((o) => (
                    // Deep-links into Admin Orders' own order-detail drawer (?view=<id>)
                    // rather than duplicating the delivery-proof photo display here -
                    // that drawer already fetches and renders it (image, delivered by,
                    // delivered at, notes) for any Delivered order.
                    <Link key={o.id} to={`/admin/orders?view=${o.id}`} className="p-3 flex items-center justify-between gap-3 hover:bg-primary-50/40">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{o.id}</p>
                        <p className="text-xs text-ink/40 truncate">{o.address}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {o.proofUploaded && <Camera className="w-3.5 h-3.5 text-leaf-600" aria-label="Proof uploaded" />}
                        <StatusPill status={o.deliveryStatus} />
                        <ChevronRight className="w-3.5 h-3.5 text-ink/30" aria-hidden="true" />
                      </div>
                    </Link>
                  ))}
                  {(!viewing.orders || viewing.orders.length === 0) && <p className="p-3.5 text-ink/40 text-sm">No orders in this run.</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <CreateRunModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); load() }} />
      <InviteDeliveryPartnerModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvited={() => setInviteOpen(false)} />
    </div>
  )
}
