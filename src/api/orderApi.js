import { http } from './client'

/** Maps to Spring Boot: GET /api/orders (mine), GET /api/admin/orders (admin), GET /api/orders/:id, POST /api/orders,
 * PATCH /api/admin/orders/:id/payment-status, PATCH /api/admin/orders/:id/delivery-status */
const orderApi = {
  listMine: () => http.get('/api/orders'),

  listAll: () => http.get('/api/admin/orders'),

  getById: (id) => http.get(`/api/orders/${id}`),

  create: ({ address, paymentMethod, items }) =>
    http.post('/api/orders', { address, paymentMethod, items }),

  updatePaymentStatus: (id, status) => http.patch(`/api/admin/orders/${id}/payment-status`, { status }),

  updateDeliveryStatus: (id, status) => http.patch(`/api/admin/orders/${id}/delivery-status`, { status }),
}

export default orderApi
