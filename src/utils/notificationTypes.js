// Central registry for the notification system. Every notification the app can ever
// generate is defined once here - type key, which role it belongs to, its category/
// priority, which icon to render, and how to build its title/message/link from params.
// Adding a brand-new role (Vendor, Delivery Partner, ...) later only means adding more
// entries here with `role: 'vendor'` etc. - NotificationBell and NotificationContext
// never need to change, since both just render/store whatever the active user's role
// maps to.

export const CATEGORIES = {
  ORDERS: 'orders',
  INVENTORY: 'inventory',
  PAYMENTS: 'payments',
  USERS: 'users',
  PRODUCTS: 'products',
  PROMOTIONS: 'promotions',
  REPORTS: 'reports',
  REVIEWS: 'reviews',
  SUPPORT: 'support',
  SECURITY: 'security',
  SYSTEM: 'system',
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
    title: 'Order Confirmed',
    message: () => 'Your order has been confirmed.',
    actionUrl: ({ orderId }) => orderUrl(orderId),
  },
  ORDER_SHIPPED: {
    role: 'customer', category: CATEGORIES.ORDERS, priority: PRIORITIES.MEDIUM, icon: 'Truck',
    title: 'Order Shipped',
    message: () => 'Your order has been shipped.',
    actionUrl: ({ orderId }) => orderUrl(orderId),
  },
  ORDER_OUT_FOR_DELIVERY: {
    role: 'customer', category: CATEGORIES.ORDERS, priority: PRIORITIES.MEDIUM, icon: 'Truck',
    title: 'Out for Delivery',
    message: () => 'Your order is out for delivery.',
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
  PRODUCT_BACK_IN_STOCK: {
    role: 'customer', category: CATEGORIES.PROMOTIONS, priority: PRIORITIES.LOW, icon: 'PackageCheck',
    title: 'Back in Stock',
    message: ({ productName }) => `${productName} is back in stock.`,
    actionUrl: ({ productId }) => `/products/${productId}`,
  },
  SPECIAL_OFFER: {
    role: 'customer', category: CATEGORIES.PROMOTIONS, priority: PRIORITIES.LOW, icon: 'Percent',
    title: 'Special Offer',
    message: ({ text }) => text || 'A new offer is live.',
    actionUrl: () => '/products',
  },
  COUPON_AVAILABLE: {
    role: 'customer', category: CATEGORIES.PROMOTIONS, priority: PRIORITIES.LOW, icon: 'Tag',
    title: 'Coupon Available',
    message: ({ code }) => `New coupon available: ${code}`,
    actionUrl: () => '/cart',
  },
  PROFILE_UPDATED: {
    role: 'customer', category: CATEGORIES.USERS, priority: PRIORITIES.LOW, icon: 'User',
    title: 'Profile Updated',
    message: () => 'Your profile was updated successfully.',
    actionUrl: () => '/dashboard/profile',
  },
  PASSWORD_CHANGED: {
    role: 'customer', category: CATEGORIES.SECURITY, priority: PRIORITIES.HIGH, icon: 'ShieldCheck',
    title: 'Password Changed',
    message: () => 'Your password was changed.',
    actionUrl: () => '/dashboard/profile',
  },
  ACCOUNT_LOGIN: {
    role: 'customer', category: CATEGORIES.SECURITY, priority: PRIORITIES.LOW, icon: 'LogIn',
    title: 'New Login',
    message: () => 'New login detected on your account.',
    actionUrl: () => '/dashboard/profile',
  },

  // ------------------------------------------------------------------- admin
  ADMIN_NEW_ORDER: {
    role: 'admin', category: CATEGORIES.ORDERS, priority: PRIORITIES.MEDIUM, icon: 'ClipboardList',
    title: 'New Order',
    message: ({ customerName }) => `New order received from ${customerName}.`,
    actionUrl: () => '/admin/orders',
  },
  ADMIN_LARGE_ORDER: {
    role: 'admin', category: CATEGORIES.ORDERS, priority: PRIORITIES.HIGH, icon: 'TrendingUp',
    title: 'High-Value Order',
    message: ({ amount }) => `High-value order worth ₹${amount} received.`,
    actionUrl: () => '/admin/orders',
  },
  ADMIN_NEW_CUSTOMER: {
    role: 'admin', category: CATEGORIES.USERS, priority: PRIORITIES.LOW, icon: 'Users',
    title: 'New Customer',
    message: ({ name }) => (name ? `${name} created a new account.` : 'A new customer has created an account.'),
    actionUrl: () => '/admin/customers',
  },
  ADMIN_LOW_STOCK: {
    role: 'admin', category: CATEGORIES.INVENTORY, priority: PRIORITIES.HIGH, icon: 'AlertTriangle',
    title: 'Low Stock',
    message: ({ productName, threshold }) => `${productName} stock is below ${threshold} units.`,
    actionUrl: () => '/admin/products',
  },
  ADMIN_OUT_OF_STOCK: {
    role: 'admin', category: CATEGORIES.INVENTORY, priority: PRIORITIES.CRITICAL, icon: 'XCircle',
    title: 'Out of Stock',
    message: ({ productName }) => `${productName} is now out of stock.`,
    actionUrl: () => '/admin/products',
  },
  ADMIN_PRODUCT_ADDED: {
    role: 'admin', category: CATEGORIES.PRODUCTS, priority: PRIORITIES.LOW, icon: 'PackagePlus',
    title: 'Product Added',
    message: ({ productName }) => `"${productName}" was added to the catalogue.`,
    actionUrl: () => '/admin/products',
  },
  ADMIN_PRODUCT_UPDATED: {
    role: 'admin', category: CATEGORIES.PRODUCTS, priority: PRIORITIES.LOW, icon: 'PackageCheck',
    title: 'Product Updated',
    message: ({ productName }) => `"${productName}" details were updated.`,
    actionUrl: () => '/admin/products',
  },
  ADMIN_PRODUCT_DELETED: {
    role: 'admin', category: CATEGORIES.PRODUCTS, priority: PRIORITIES.MEDIUM, icon: 'Trash2',
    title: 'Product Deleted',
    message: ({ productName }) => (productName ? `"${productName}" was deleted.` : 'A product was deleted.'),
    actionUrl: () => '/admin/products',
  },
  ADMIN_PAYMENT_FAILED: {
    role: 'admin', category: CATEGORIES.PAYMENTS, priority: PRIORITIES.HIGH, icon: 'AlertTriangle',
    title: 'Payment Failed',
    message: ({ orderId }) => `Payment failed for Order #${orderId}.`,
    actionUrl: () => '/admin/orders',
  },
  ADMIN_REFUND_REQUESTED: {
    role: 'admin', category: CATEGORIES.PAYMENTS, priority: PRIORITIES.HIGH, icon: 'RotateCcw',
    title: 'Refund Requested',
    message: () => 'A customer requested a refund.',
    actionUrl: () => '/admin/orders',
  },
  ADMIN_REVIEW_SUBMITTED: {
    role: 'admin', category: CATEGORIES.REVIEWS, priority: PRIORITIES.LOW, icon: 'Star',
    title: 'Review Submitted',
    message: ({ rating, productName }) => `A customer submitted a ${rating}-star review${productName ? ` for ${productName}` : ''}.`,
    actionUrl: ({ productId }) => (productId ? `/products/${productId}` : '/admin/products'),
  },
  ADMIN_REVIEW_NEGATIVE: {
    role: 'admin', category: CATEGORIES.REVIEWS, priority: PRIORITIES.HIGH, icon: 'Star',
    title: 'Negative Review',
    message: ({ productName }) => `A customer left a low rating${productName ? ` on ${productName}` : ''}.`,
    actionUrl: ({ productId }) => (productId ? `/products/${productId}` : '/admin/products'),
  },
  ADMIN_LOGIN: {
    role: 'admin', category: CATEGORIES.SECURITY, priority: PRIORITIES.LOW, icon: 'LogIn',
    title: 'Admin Login',
    message: () => 'Administrator logged in.',
    actionUrl: () => '/admin',
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
