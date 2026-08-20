const ROLE_LABEL = { ADMIN: 'Admin', EMPLOYEE: 'Employee', CUSTOMER: 'You' }

// Renders nothing until the backend actually provides cancelledByRole - no
// hardcoded fallback text, so an order cancelled before this feature existed
// just shows the plain "Cancelled" pill with no extra claim about who did it.
export default function CancellationInfo({ order }) {
  if (order?.deliveryStatus !== 'Cancelled' || !order.cancelledByRole) return null

  const isStaff = order.cancelledByRole === 'ADMIN' || order.cancelledByRole === 'EMPLOYEE'
  const roleLabel = ROLE_LABEL[order.cancelledByRole] || order.cancelledByRole

  return (
    <div className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-xs text-red-700 space-y-0.5">
      <p className="font-semibold">
        Cancelled by {roleLabel}{isStaff && order.cancelledByName ? ` · ${order.cancelledByName}` : ''}
      </p>
      {order.cancellationReason && <p className="text-red-600/80">Reason: {order.cancellationReason}</p>}
    </div>
  )
}
