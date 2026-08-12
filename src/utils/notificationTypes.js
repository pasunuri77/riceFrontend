// Central registry for the notification system. Every notification the app can ever
// generate is defined once here - type key, which role it belongs to, its category/
// priority, which icon to render, and how to build its title/message/link from params.
// Kept deliberately small: customers only get their own order/payment lifecycle
// events, admins only get new-customer/new-order/order-cancelled - no login noise,
// no speculative types for features the backend doesn't support yet.

export const CATEGORIES = {
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  USERS: 'users',
}

export const PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

const orderUrl = (id) => `/dashboard/orders/${id}`

// Each entry: { role, category, priority, icon, title, message(params), actionUrl(params) }
// `icon` is a lucide-react component name (string) - resolved to a component in
// NotificationBell so the context/storage layer never has to hold JSX.
export const NOTIFICATION_TYPES = {
  // ---------------------------------------------------------------- customer
  ORDER_PLACED: {
    role: 'customer', category: CATEGORIES.ORDERS, priority: PRIORITIES.MEDIUM, icon: 'Package',
    title: 'Order Placed',
    message: ({ orderId }) => `Your order #${orderId} has been placed successfully.`,
    actionUrl: ({ orderId }) => orderUrl(orderId),
  },
  ORDER_CONFIRMED: {
    role: 'customer', category: CATEGORIES.ORDERS, priority: PRIORITIES.MEDIUM, icon: 'PackageCheck',
    title: 'Order Processing',
    message: () => 'Your order is being processed.',
    actionUrl: ({ orderId }) => orderUrl(orderId),
  },
  ORDER_SHIPPED: {
    role: 'customer', category: CATEGORIES.ORDERS, priority: PRIORITIES.MEDIUM, icon: 'Truck',
    title: 'Order Shipped',
    message: () => 'Your order has been shipped.',
    actionUrl: ({ orderId }) => orderUrl(orderId),
  },
  ORDER_DELIVERED: {
    role: 'customer', category: CATEGORIES.ORDERS, priority: PRIORITIES.MEDIUM, icon: 'CheckCircle2',
    title: 'Order Delivered',
    message: () => 'Your order has been delivered.',
    actionUrl: ({ orderId }) => orderUrl(orderId),
  },
  ORDER_CANCELLED: {
    role: 'customer', category: CATEGORIES.ORDERS, priority: PRIORITIES.MEDIUM, icon: 'XCircle',
    title: 'Order Cancelled',
    message: () => 'Your order has been cancelled.',
    actionUrl: ({ orderId }) => orderUrl(orderId),
  },
  PAYMENT_SUCCESS: {
    role: 'customer', category: CATEGORIES.PAYMENTS, priority: PRIORITIES.MEDIUM, icon: 'CreditCard',
    title: 'Payment Successful',
    message: ({ amount }) => `Payment of ₹${amount} completed successfully.`,
    actionUrl: ({ orderId }) => orderUrl(orderId),
  },
  PAYMENT_FAILED: {
    role: 'customer', category: CATEGORIES.PAYMENTS, priority: PRIORITIES.HIGH, icon: 'AlertTriangle',
    title: 'Payment Failed',
    message: () => 'Your payment could not be processed.',
    actionUrl: () => '/checkout',
  },
  // Not wired to anything yet - the backend has no refund concept at all
  // (payment status is just Pending/Paid, no Refunded state exists). Kept
  // defined so it's ready the moment that exists; see BACKEND_TODO.
  REFUND_INITIATED: {
    role: 'customer', category: CATEGORIES.PAYMENTS, priority: PRIORITIES.MEDIUM, icon: 'RotateCcw',
    title: 'Refund Initiated',
    message: () => 'Your refund has been initiated.',
    actionUrl: ({ orderId }) => orderUrl(orderId),
  },
  REFUND_COMPLETED: {
    role: 'customer', category: CATEGORIES.PAYMENTS, priority: PRIORITIES.MEDIUM, icon: 'RotateCcw',
    title: 'Refund Completed',
    message: () => 'Your refund has been credited.',
    actionUrl: ({ orderId }) => orderUrl(orderId),
  },
  PROFILE_UPDATED: {
    role: 'customer', category: CATEGORIES.USERS, priority: PRIORITIES.LOW, icon: 'User',
    title: 'Profile Updated',
    message: () => 'Your profile was updated successfully.',
    actionUrl: () => '/dashboard/profile',
  },

  // ------------------------------------------------------------------- admin
  ADMIN_NEW_ORDER: {
    role: 'admin', category: CATEGORIES.ORDERS, priority: PRIORITIES.MEDIUM, icon: 'ClipboardList',
    title: 'New Order',
    message: ({ customerName }) => `New order received from ${customerName}.`,
    actionUrl: ({ orderId }) => `/admin/orders?view=${orderId}`,
  },
  ADMIN_ORDER_CANCELLED: {
    role: 'admin', category: CATEGORIES.ORDERS, priority: PRIORITIES.MEDIUM, icon: 'XCircle',
    title: 'Order Cancelled',
    message: ({ orderId, customerName }) => `Order #${orderId} was cancelled${customerName ? ` by ${customerName}` : ''}.`,
    actionUrl: ({ orderId }) => `/admin/orders?view=${orderId}`,
  },
  ADMIN_NEW_CUSTOMER: {
    role: 'admin', category: CATEGORIES.USERS, priority: PRIORITIES.LOW, icon: 'Users',
    title: 'New Customer',
    message: ({ name }) => (name ? `${name} created a new account.` : 'A new customer has created an account.'),
    actionUrl: ({ customerId }) => (customerId ? `/admin/customers?id=${customerId}` : '/admin/customers'),
  },
}

export function buildNotification(typeKey, params, { userId, role }) {
  const def = NOTIFICATION_TYPES[typeKey]
  if (!def) throw new Error(`Unknown notification type "${typeKey}"`)
  const now = new Date().toISOString()
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    role,
    type: typeKey,
    category: def.category,
    priority: def.priority,
    icon: def.icon,
    title: def.title,
    message: def.message(params || {}),
    actionUrl: def.actionUrl ? def.actionUrl(params || {}) : null,
    isRead: false,
    createdAt: now,
    updatedAt: now,
  }
}
