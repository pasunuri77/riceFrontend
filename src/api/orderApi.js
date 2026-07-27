import { http } from './client'

/** Maps to Spring Boot: GET /api/orders (mine), GET /api/admin/orders (admin), GET /api/orders/:id, POST /api/orders */
const orderApi = {
  listMine: () => http.get('/api/orders'),

  listAll: () => http.get('/api/admin/orders'),

  getById: (id) => http.get(`/api/orders/${id}`),

  create: ({ address, paymentMethod, items }) =>
    http.post('/api/orders', { address, paymentMethod, items }),
}

export default orderApi
