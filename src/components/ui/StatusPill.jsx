export const STATUS_STYLES = {
  Delivered: 'bg-leaf-100 text-leaf-700',
  Shipped: 'bg-blue-100 text-blue-700',
  Processing: 'bg-amber-100 text-amber-700',
  Pending: 'bg-orange-100 text-orange-700',
  Paid: 'bg-leaf-100 text-leaf-700',
  Cancelled: 'bg-red-100 text-red-600',
  'Return Requested': 'bg-orange-100 text-orange-700',
  'Return Approved': 'bg-leaf-100 text-leaf-700',
  'Return Received': 'bg-blue-100 text-blue-700',
  'Refund Processed': 'bg-leaf-100 text-leaf-700',
  'Return Rejected': 'bg-red-100 text-red-600',
  Active: 'bg-leaf-100 text-leaf-700',
  Inactive: 'bg-black/10 text-ink/50',
}

export default function StatusPill({ status }) {
  return <span className={`badge ${STATUS_STYLES[status] || 'bg-black/10 text-ink/60'}`}>{status}</span>
}
