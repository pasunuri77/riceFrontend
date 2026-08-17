import { http } from './client'

/** Maps to Spring Boot:
 * GET /api/admin/customers
 * GET /api/admin/customers/:id
 * PATCH /api/admin/customers/:id/status
 * POST /api/admin/customers (admin creating a customer/player on behalf of them)
 * DELETE /api/admin/customers/:id
 */
const customerApi = {
  list: () => http.get('/api/admin/customers'),
  getById: (id) => http.get(`/api/admin/customers/${id}`),
  updateStatus: (id, status) => http.patch(`/api/admin/customers/${id}/status`, { status }),

  // Admin-created customer, e.g. a walk-in/phone order for someone not yet
  // registered. Backend creates the account (temp password + setup email,
  // mirroring the staff invite flow) and returns it in the same shape as the
  // rest of this API so it can be selected immediately for an order.
  create: ({ fullName, email, mobile }) =>
    http.post('/api/admin/customers', { fullName, email, mobile }),

  remove: (id) => http.delete(`/api/admin/customers/${id}`),
}

export default customerApi
