import { http } from './client'

/** Maps to Spring Boot:
 * GET /api/orders (mine)
 * GET /api/admin/orders (admin)
 * GET /api/orders/:id
 * POST /api/orders

 * PATCH /api/admin/orders/:id/payment-status
 * PATCH /api/admin/orders/:id/delivery-status
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
}

export default orderApi
