import { http } from './client'

/** Maps to Spring Boot: GET /api/admin/customers, PATCH /api/admin/customers/:id/status */
const customerApi = {
  list: () => http.get('/api/admin/customers'),
  getById: (id) => http.get(`/api/admin/customers/${id}`),
  updateStatus: (id, status) => http.patch(`/api/admin/customers/${id}/status`, { status }),
}

export default customerApi
