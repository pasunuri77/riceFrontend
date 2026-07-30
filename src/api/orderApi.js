import { http } from './client'

/** Maps to Spring Boot order endpoints for user and admin workflows. */
const orderApi = {
  listMine: () => http.get('/api/orders'),

  listAll: () => http.get('/api/admin/orders'),

  getById: (id) => http.get(`/api/orders/${id}`),

  create: ({ address, paymentMethod, items }) =>
    http.post('/api/orders', { address, paymentMethod, items }),

  updatePaymentStatus: (id, status) =>
    http.patch(`/api/admin/orders/${id}/payment-status`, { status }),

  updateDeliveryStatus: (id, status) =>
    http.patch(`/api/admin/orders/${id}/delivery-status`, { status }),
}

export default orderApi
