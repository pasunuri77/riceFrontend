import { http } from './client'

/** Maps to Spring Boot:
 * GET /api/orders (mine)
 * GET /api/admin/orders (admin)
 * GET /api/orders/:id
 * POST /api/orders

 * PATCH /api/admin/orders/:id/payment-status
 * PATCH /api/admin/orders/:id/delivery-status
 * PATCH /api/admin/orders/:id/confirm
 * POST /api/admin/orders (book on behalf of a customer)
 */
const orderApi = {
  listMine: () => http.get('/api/orders'),

  listAll: () => http.get('/api/admin/orders'),

  // GET /api/orders/:id takes the raw numeric database id, but every order in the
  // UI uses the "ORD10013" display format (= 10000 + db id) - translate it here so
  // callers can just pass whatever id the rest of the app already works with.
  getById: (id) => {
    const numericId = typeof id === 'string' && id.toUpperCase().startsWith('ORD')
      ? Number(id.slice(3)) - 10000
      : id
    return http.get(`/api/orders/${numericId}`)
  },

  create: ({ address, paymentMethod, items, couponCode, notes }) =>
    http.post('/api/orders', { address, paymentMethod, items, couponCode, notes }),


  cancel: (id) => http.patch(`/api/orders/${id}/cancel`),

  updatePaymentStatus: (id, status) =>
    http.patch(`/api/admin/orders/${id}/payment-status`, { status }),

  updateDeliveryStatus: (id, status) =>
    http.patch(`/api/admin/orders/${id}/delivery-status`, { status }),

  // Admin-only "Confirm Order" action - transitions a Pending order to Processing.
  // Kept as its own endpoint (rather than reusing updateDeliveryStatus) so the
  // backend can enforce the Pending -> Processing transition specifically and
  // reject confirming an order that isn't currently Pending.
  confirmOrder: (id) => http.patch(`/api/admin/orders/${id}/confirm`),

  // Admin creating/booking an order on behalf of an existing or newly-added
  // customer. customerId identifies who the order belongs to; everything else
  // mirrors the shape of the customer-facing create() call above. orderType
  // ('online' | 'offline') tells the backend whether to apply a delivery
  // charge - an offline (in-store/walk-in) order has no address and no
  // delivery charge, only product cost + tax, same as online minus delivery.
  createForCustomer: ({ customerId, orderType, address, paymentMethod, items, notes, markAsPaid, couponCode }) =>
    http.post('/api/admin/orders', { customerId, orderType, address, paymentMethod, items, notes, markAsPaid, couponCode }),
}

export default orderApi
