// Single source of truth for the Employee permission set - shared by the
// Customers page's Permissions modal (grants) and AdminLayout's nav gating
// (reads), so the two can never drift out of sync with each other.
//
// canManageCustomers also gates the merged Customers+Staff list itself
// (invite/view/delete) - there's no separate "manage staff" permission,
// since an employee is never allowed to manage other admins/employees
// regardless of permissions (see the hierarchy rules in Customers.jsx).
export const PERMISSIONS = [
  { key: 'canManageProducts', label: 'Products', desc: 'Add, edit & remove products' },
  { key: 'canManageOrders', label: 'Orders', desc: 'View, confirm & update orders' },
  { key: 'canManageCustomers', label: 'Customers', desc: 'View & manage customer accounts' },
  { key: 'canManageCoupons', label: 'Coupons', desc: 'Create & edit discount coupons' },
  { key: 'canManagePayments', label: 'Payments', desc: 'View payment records & refunds' },
  { key: 'canViewReports', label: 'Reports', desc: 'Access sales & revenue reports' },
  { key: 'canManageDeliveryTax', label: 'Delivery & Tax', desc: 'Edit delivery areas & tax rates' },
]
