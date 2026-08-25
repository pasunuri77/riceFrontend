import { useEffect, useState } from 'react'
import { Package } from 'lucide-react'
import Drawer from './Drawer'
import StatusPill from './StatusPill'
import { formatUSD, formatDate, fitTextSizeClass } from '../../utils/format'
import { ApiError } from '../../api/client'
import customerApi from '../../api/customerApi'

const STAT_SCALE = ['text-lg', 'text-base', 'text-sm']

// Drop-in replacement for linking out to /admin/customers?id=<id> - shows the
// same record inline wherever a customer's name is clicked (Orders, Delivery
// Runs, etc.) instead of navigating away from whatever the admin was looking
// at. Read-only (no block/unblock) - that action lives on the Customers page
// itself, which already has the surrounding table state to refresh after it.
export default function CustomerDetailsDrawer({ open, onClose, customerId }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !customerId) return
    setCustomer(null)
    setError(null)
    setLoading(true)
    customerApi.getById(customerId)
      .then(setCustomer)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Unable to load customer'))
      .finally(() => setLoading(false))
  }, [open, customerId])

  return (
    <Drawer open={open} onClose={onClose} title="Customer Details" width="max-w-md">
      {loading ? (
        <div className="p-5 text-sm text-ink/40">Loading...</div>
      ) : error ? (
        <div className="p-5 text-sm text-red-500">{error}</div>
      ) : customer ? (
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold shrink-0">{customer.name?.[0]}</div>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{customer.name}</p>
              <p className="text-sm text-ink/50 truncate">{customer.email}</p>
            </div>
            <StatusPill status={customer.status} />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-primary-50 rounded-xl p-3"><p className={`${fitTextSizeClass(customer.orders, STAT_SCALE)} font-extrabold font-display whitespace-nowrap`}>{customer.orders}</p><p className="text-[11px] text-ink/50 mt-0.5">Orders</p></div>
            <div className="bg-primary-50 rounded-xl p-3"><p className={`${fitTextSizeClass(formatUSD(customer.totalSpent), STAT_SCALE)} font-extrabold font-display whitespace-nowrap`}>{formatUSD(customer.totalSpent)}</p><p className="text-[11px] text-ink/50 mt-0.5">Total Spent</p></div>
            <div className="bg-primary-50 rounded-xl p-3"><p className={`${fitTextSizeClass(formatDate(customer.joined), STAT_SCALE)} font-extrabold font-display whitespace-nowrap`}>{formatDate(customer.joined)}</p><p className="text-[11px] text-ink/50 mt-0.5">Joined</p></div>
          </div>

          <div className="flex justify-between text-sm border-t border-black/5 pt-3">
            <span className="text-ink/50">Mobile</span><span className="font-semibold">{customer.mobile || '--'}</span>
          </div>

          {customer.orders === 0 && (
            <p className="text-sm text-ink/40 flex items-center gap-2"><Package className="w-4 h-4" /> No orders yet.</p>
          )}
        </div>
      ) : null}
    </Drawer>
  )
}
