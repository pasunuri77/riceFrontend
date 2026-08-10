import { http } from './client'

/** Maps to Spring Boot: GET /api/coupons, POST /api/coupons/validate,
 * POST/PUT/DELETE /api/admin/coupons */
const couponApi = {
  list: () => http.get('/api/coupons'),
  validate: (code, subtotal) => http.post('/api/coupons/validate', { code, subtotal }),
  create: (data) => http.post('/api/admin/coupons', data),
  update: (id, data) => http.put(`/api/admin/coupons/${id}`, data),
  remove: (id) => http.delete(`/api/admin/coupons/${id}`),
}

export default couponApi
