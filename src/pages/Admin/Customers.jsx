import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, Ban, CheckCircle2, Package, Shield, Trash2, UserPlus, Mail } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import Modal from '../../components/ui/Modal'
import Drawer from '../../components/ui/Drawer'
import RowActionsMenu from '../../components/ui/RowActionsMenu'
import StatusPill from '../../components/ui/StatusPill'
import Pagination from '../../components/ui/Pagination'
import SearchInput from '../../components/ui/SearchInput'
import TableShell from '../../components/ui/TableShell'
import SortableHeader from '../../components/ui/SortableHeader'
import ColumnVisibilityMenu from '../../components/ui/ColumnVisibilityMenu'
import ExportMenu from '../../components/ui/ExportMenu'
import { formatUSD, formatDate, fitTextSizeClass } from '../../utils/format'
import { bagWeightLb } from '../../utils/stock'
import { exportToCsv, exportToExcel } from '../../utils/exportTable'
import { PERMISSIONS } from '../../data/permissions'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { ApiError } from '../../api/client'
import customerApi from '../../api/customerApi'
import orderApi from '../../api/orderApi'
import staffApi from '../../api/staffApi'
import { RowSkeleton } from '../../components/ui/Skeleton'

const itemsSummary = (o) => (o.items?.length ? o.items.map((i) => `${i.name} (${bagWeightLb(i.weight)}lb Bag x${i.qty})`).join(', ') : o.riceName)

const PAGE_SIZE = 8
const MODAL_STAT_SCALE = ['text-lg', 'text-base', 'text-sm']
const ROLE_TABS = ['All', 'Customers', 'Employees', 'Admins']
const roleForTab = { Customers: 'user', Employees: 'employee', Admins: 'admin' }
const ROLE_STYLES = {
  user: { badge: 'bg-leaf-100 text-leaf-700', avatar: 'bg-leaf-500' },
  employee: { badge: 'bg-blue-100 text-blue-700', avatar: 'bg-blue-500' },
  admin: { badge: 'bg-primary-100 text-primary-700', avatar: 'bg-primary-500' },
}
const ROLE_LABEL = { user: 'Customer', employee: 'Employee', admin: 'Admin' }
// Customers are never invited from here - they're created inline while
// booking an order on their behalf (Admin > New Order), so there's no need to
// duplicate that flow. This modal is staff-only: Employee or Admin. No Super
// Admin tier either - riceApp only distinguishes Admin (full access) from
// Employee (granular permissions).
const INVITE_ROLES = ['employee', 'admin']

const COLUMNS = [
  { key: 'name', label: 'User', sortField: 'name' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'joined', label: 'Joined', sortField: 'joined' },
]

function RolePicker({ value, onChange, options }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((r) => {
        const selected = value === r
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
              selected ? `${ROLE_STYLES[r].avatar} text-white border-transparent` : 'bg-black/[0.02] border-black/10 text-ink/60 opacity-60 hover:opacity-100'
            }`}
          >
            {ROLE_LABEL[r]}
          </button>
        )
      })}
    </div>
  )
}

export default function AdminCustomers() {
  const { user: me } = useAuth()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [customers, setCustomers] = useState([])
  const [staff, setStaff] = useState([])
  const [ordersData, setOrdersData] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('All')
  const [sort, setSort] = useState({ key: 'joined', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState(null)
  const [visibleCols, setVisibleCols] = useState({})

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ fullName: '', mobile: '', email: '', role: 'employee' })
  const [inviting, setInviting] = useState(false)

  const [permUser, setPermUser] = useState(null)
  const [perms, setPerms] = useState({})
  const [permLoading, setPermLoading] = useState(false)

  const isAdmin = me?.role === 'admin'

  const load = () => Promise.all([
    // /api/admin/customers has been observed to return every account, not just
    // customers (e.g. an admin's own account can come back through it too) -
    // respect whatever role the backend actually attached rather than blindly
    // overwriting it, so an admin/employee record isn't mislabeled "Customer".
    customerApi.list().then((list) => setCustomers(list.map((c) => ({ ...c, role: c.role || 'user' })))).catch(() => setCustomers([])),
    staffApi.list().then(setStaff).catch(() => setStaff([])),
    orderApi.listAll().then(setOrdersData).catch(() => setOrdersData([])),
  ]).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  // Once /api/admin/staff is live, the same account could come back from both
  // lists - de-dupe by id, preferring the staff record (it's the authoritative
  // source for role/status/permissions for admin & employee accounts).
  const allUsers = useMemo(() => {
    const staffIds = new Set(staff.map((s) => s.id))
    return [...customers.filter((c) => !staffIds.has(c.id)), ...staff]
  }, [customers, staff])

  useEffect(() => {
    const id = searchParams.get('id')
    if (!id || allUsers.length === 0) return
    const match = allUsers.find((c) => c.id === id)
    if (match) setViewing(match)
    setSearchParams({}, { replace: true })
  }, [searchParams, allUsers])

  const counts = useMemo(() => ({
    All: allUsers.length,
    Customers: allUsers.filter((u) => u.role === 'user').length,
    Employees: allUsers.filter((u) => u.role === 'employee').length,
    Admins: allUsers.filter((u) => u.role === 'admin').length,
  }), [allUsers, customers, staff])

  const list = useMemo(() => {
    const roleFilter = roleForTab[tab]
    let next = allUsers.filter((c) =>
      (!roleFilter || c.role === roleFilter) &&
      `${c.name} ${c.email} ${c.mobile}`.toLowerCase().includes(search.toLowerCase())
    )
    if (sort.key) {
      const field = COLUMNS.find((c) => c.key === sort.key)?.sortField
      if (field) {
        next = [...next].sort((a, b) => {
          let av = a[field]; let bv = b[field]
          if (field === 'joined') { av = new Date(av || 0); bv = new Date(bv || 0) }
          if (typeof av === 'string') { av = av.toLowerCase(); bv = (bv || '').toLowerCase() }
          if (av < bv) return sort.dir === 'asc' ? -1 : 1
          if (av > bv) return sort.dir === 'asc' ? 1 : -1
          return 0
        })
      }
    }
    return next
  }, [allUsers, tab, search, sort])

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const pageItems = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  const toggleCol = (key) => setVisibleCols((v) => ({ ...v, [key]: v[key] === false ? true : false }))
  const isVisible = (key) => visibleCols[key] !== false

  const replaceCustomer = (updated) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? { ...updated, role: 'user' } : c)))
    setViewing((v) => (v?.id === updated.id ? { ...updated, role: 'user' } : v))
  }
  const replaceStaff = (updated) => {
    setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setViewing((v) => (v?.id === updated.id ? updated : v))
  }

  const toggleActive = (target) => {
    if (target.role === 'user') {
      const nextStatus = target.status === 'Active' ? 'Blocked' : 'Active'
      customerApi.updateStatus(target.id, nextStatus).then((updated) => {
        replaceCustomer(updated)
        showToast(nextStatus === 'Blocked' ? `${target.name} blocked` : `${target.name} unblocked`, nextStatus === 'Blocked' ? 'error' : 'success')
      }).catch((err) => showToast(err instanceof ApiError ? err.message : 'Failed to update status', 'error'))
      return
    }
    // Deactivating staff is an admin-only action - the UI never renders this
    // control for an employee viewer (see the Actions cell below).
    const nextStatus = target.status === 'Active' ? 'Inactive' : 'Active'
    staffApi.updateStatus(target.id, nextStatus).then((updated) => {
      replaceStaff(updated)
      showToast(nextStatus === 'Inactive' ? `${target.name} deactivated` : `${target.name} reactivated`, nextStatus === 'Inactive' ? 'error' : 'success')
    }).catch((err) => showToast(err instanceof ApiError ? err.message : 'Failed to update status', 'error'))
  }

  // Delete hierarchy, exactly as specified:
  // - Nobody can delete their own account.
  // - Admin can delete anyone else (customer, employee, or another admin).
  // - Employee can delete customers only - never an admin, and never another employee or themself.
  const canDelete = (target) => {
    if (!me || target.id === me.id) return false
    if (me.role === 'admin') return true
    if (me.role === 'employee') return target.role === 'user'
    return false
  }
  const deleteTooltip = (target) => {
    if (target.id === me?.id) return 'Cannot delete your own account'
    if (me?.role === 'employee' && target.role !== 'user') return 'Employees can only remove customer accounts'
    return null
  }

  const removeUser = async (target) => {
    if (!window.confirm(`Remove ${target.name}? This can't be undone.`)) return
    try {
      if (target.role === 'user') {
        await customerApi.remove(target.id)
        setCustomers((prev) => prev.filter((c) => c.id !== target.id))
      } else {
        await staffApi.remove(target.id)
        setStaff((prev) => prev.filter((s) => s.id !== target.id))
      }
      setViewing((v) => (v?.id === target.id ? null : v))
      showToast(`${target.name} removed`, 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to remove', 'error')
    }
  }

  const sendInvite = async () => {
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim()) { showToast('Name and email are required', 'error'); return }
    if (inviteForm.mobile.length !== 10) { showToast('Enter a valid 10-digit mobile number', 'error'); return }
    setInviting(true)
    try {
      await staffApi.invite(inviteForm)
      showToast(`Invitation sent to ${inviteForm.email}`, 'success')
      setInviteOpen(false)
      setInviteForm({ fullName: '', mobile: '', email: '', role: 'employee' })
      load()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to send invite', 'error')
    } finally {
      setInviting(false)
    }
  }

  const openPermissions = async (target) => {
    setPermUser(target)
    try { setPerms((await staffApi.getPermissions(target.id)) || {}) } catch { setPerms({}) }
  }
  const togglePerm = (key) => setPerms((p) => ({ ...p, [key]: !p[key] }))
  const savePermissions = async () => {
    setPermLoading(true)
    try {
      await staffApi.updatePermissions(permUser.id, perms)
      showToast('Permissions updated - takes effect immediately', 'success')
      setPermUser(null)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update permissions', 'error')
    } finally {
      setPermLoading(false)
    }
  }

  const customerOrders = (id) => ordersData.filter((o) => o.customerId === id)

  const exportColumns = [
    { label: 'Name', value: (c) => c.name },
    { label: 'Email', value: (c) => c.email },
    { label: 'Mobile', value: (c) => c.mobile },
    { label: 'Role', value: (c) => ROLE_LABEL[c.role] },
    { label: 'Status', value: (c) => c.status },
    { label: 'Joined', value: (c) => c.joined },
  ]

  const colCount = COLUMNS.length + 1

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Customers' }]} />
      <PageHeader
        title="Customer & Staff Management"
        subtitle={`${list.length} of ${allUsers.length} users`}
        action={isAdmin && (
          <button onClick={() => { setInviteForm({ fullName: '', mobile: '', email: '', role: 'employee' }); setInviteOpen(true) }} className="btn-primary text-sm"><UserPlus className="w-4 h-4" /> Invite Staff</button>
        )}
      />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {ROLE_TABS.map((t) => (
            <button key={t} onClick={() => { setTab(t); setPage(1) }} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === t ? 'bg-primary-500 text-white' : 'bg-white border border-black/10 text-ink/60'}`}>
              {t} ({counts[t]})
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search name, email, mobile..." className="" inputClassName="!w-64" />
          <ColumnVisibilityMenu columns={COLUMNS} visible={visibleCols} onToggle={toggleCol} />
          <ExportMenu
            onExportCsv={() => exportToCsv('users', exportColumns, list)}
            onExportExcel={() => exportToExcel('users', exportColumns, list)}
          />
        </div>
      </div>

      <TableShell minWidth="900px">
          <thead>
            <tr className="text-left text-ink/40 text-xs uppercase border-b border-black/5">
              {isVisible('name') && <SortableHeader label="User" sortKey="name" sort={sort} onSort={toggleSort} />}
              {isVisible('mobile') && <th scope="col" className="p-3.5">Mobile</th>}
              {isVisible('role') && <th scope="col" className="p-3.5">Role</th>}
              {isVisible('status') && <th scope="col" className="p-3.5">Status</th>}
              {isVisible('joined') && <SortableHeader label="Joined" sortKey="joined" sort={sort} onSort={toggleSort} />}
              <th scope="col" className="p-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} cols={colCount} />)}
            {!loading && pageItems.map((c) => {
              const disabledDelete = !canDelete(c)
              return (
                <tr key={c.id} className="border-b border-black/5 last:border-0 hover:bg-primary-50/40">
                  {isVisible('name') && (
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${ROLE_STYLES[c.role].avatar} text-white flex items-center justify-center text-xs font-bold shrink-0`}>{c.name?.[0]}</div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{c.name}</p>
                          <p className="text-xs text-ink/40 truncate">{c.email}</p>
                        </div>
                        {c.pendingSetup && <span className="badge bg-amber-100 text-amber-700 text-[10px] shrink-0">Pending Setup</span>}
                      </div>
                    </td>
                  )}
                  {isVisible('mobile') && <td className="p-3 text-ink/60">{c.mobile || '--'}</td>}
                  {isVisible('role') && <td className="p-3"><span className={`badge ${ROLE_STYLES[c.role].badge}`}>{ROLE_LABEL[c.role]}</span></td>}
                  {isVisible('status') && <td className="p-3"><StatusPill status={c.status || 'Active'} /></td>}
                  {isVisible('joined') && <td className="p-3 text-ink/50">{c.joined ? formatDate(c.joined) : '--'}</td>}
                  <td className="p-3">
                    <RowActionsMenu
                      id={`user-${c.id}`}
                      label={`Actions for ${c.name}`}
                      items={[
                        { label: 'View', icon: Eye, onClick: () => setViewing(c) },
                        ...(isAdmin && c.role === 'employee'
                          ? [{ label: 'Permissions', icon: Shield, onClick: () => openPermissions(c) }]
                          : []),
                        {
                          label: 'Delete',
                          icon: Trash2,
                          danger: true,
                          disabled: disabledDelete,
                          disabledReason: disabledDelete ? deleteTooltip(c) : undefined,
                          onClick: () => removeUser(c),
                        },
                      ]}
                    />
                  </td>
                </tr>
              )
            })}
            {!loading && pageItems.length === 0 && (
              <tr><td colSpan={colCount} className="p-8 text-center text-ink/40">No users match your filters.</td></tr>
            )}
          </tbody>
      </TableShell>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Invite staff modal - admin-only; customers are added via New Order instead */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Staff">
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
            <Mail className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
            <p className="text-xs text-ink/60">An invitation email will be sent with a secure link to set up their password. The link expires in 24 hours.</p>
          </div>
          <input value={inviteForm.fullName} onChange={(e) => setInviteForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Full name" className="input-field" />
          <input
            value={inviteForm.mobile}
            onChange={(e) => setInviteForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Mobile number"
            className="input-field"
          />
          <input value={inviteForm.email} onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))} type="email" placeholder="Email" className="input-field" />
          <div>
            <p className="label-field">Role</p>
            <RolePicker value={inviteForm.role} onChange={(role) => setInviteForm((f) => ({ ...f, role }))} options={INVITE_ROLES} />
          </div>
          <button onClick={sendInvite} disabled={inviting} className="btn-primary w-full disabled:opacity-60">
            {inviting ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </Modal>

      {/* Permissions modal (Employee rows, admin-only trigger) */}
      <Modal open={!!permUser} onClose={() => setPermUser(null)} title={`Permissions - ${permUser?.name || ''}`}>
        <p className="text-xs text-ink/50 mb-3">Toggle module access for this employee. Changes take effect immediately.</p>
        <div className="space-y-2">
          {PERMISSIONS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => togglePerm(p.key)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border ${perms[p.key] ? 'bg-primary-50 border-primary-200' : 'bg-black/[0.02] border-black/5'}`}
            >
              <div className="text-left">
                <p className={`text-sm font-bold ${perms[p.key] ? 'text-primary-700' : 'text-ink'}`}>{p.label}</p>
                <p className="text-xs text-ink/50">{p.desc}</p>
              </div>
              <div className={`w-10 h-5 rounded-full relative shrink-0 transition-colors ${perms[p.key] ? 'bg-primary-500' : 'bg-black/15'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${perms[p.key] ? 'left-5' : 'left-0.5'}`} />
              </div>
            </button>
          ))}
        </div>
        <button onClick={savePermissions} disabled={permLoading} className="btn-primary w-full mt-4 disabled:opacity-60">
          {permLoading ? 'Saving...' : 'Save Permissions'}
        </button>
      </Modal>

      {/* View details - slide-in from the right, matching Orders' detail panel */}
      <Drawer open={!!viewing} onClose={() => setViewing(null)} title={viewing?.role === 'user' ? 'Customer Details' : 'Staff Details'} width="max-w-lg">
        {viewing && viewing.role === 'user' && (
          <div className="p-5 space-y-5">
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
              <div className="bg-primary-50 rounded-xl p-3"><p className={`${fitTextSizeClass(formatUSD(viewing.totalSpent), MODAL_STAT_SCALE)} font-extrabold font-display whitespace-nowrap`}>{formatUSD(viewing.totalSpent)}</p><p className="text-[11px] text-ink/50 mt-0.5">Total Spent</p></div>
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
                        <p className="font-bold">{formatUSD(o.amount)}</p>
                        <StatusPill status={o.deliveryStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => toggleActive(viewing)} className={`btn w-full ${viewing.status === 'Active' ? 'bg-red-50 text-red-500' : 'bg-leaf-50 text-leaf-700'}`}>
              {viewing.status === 'Active' ? <><Ban className="w-4 h-4" /> Block Customer</> : <><CheckCircle2 className="w-4 h-4" /> Unblock Customer</>}
            </button>
          </div>
        )}
        {viewing && viewing.role !== 'user' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${ROLE_STYLES[viewing.role].avatar} text-white flex items-center justify-center text-lg font-bold shrink-0`}>{viewing.name?.[0]}</div>
              <div className="min-w-0">
                <p className="font-bold">{viewing.name}</p>
                <p className="text-sm text-ink/50 truncate">{viewing.email}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm border-t border-black/5 pt-3">
              <span className="text-ink/50">Role</span><span className={`badge ${ROLE_STYLES[viewing.role].badge}`}>{ROLE_LABEL[viewing.role]}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/50">Mobile</span><span className="font-semibold">{viewing.mobile || '--'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/50">Access</span>
              <span className="font-semibold text-right max-w-[65%]">
                {viewing.role === 'admin' ? 'Full admin access - all modules & settings' : 'Restricted access - permissions set individually'}
              </span>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
