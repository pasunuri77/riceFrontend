import { http, uploadFile } from './client'

/** Maps to Spring Boot: GET/POST/PUT/DELETE /api/products (admin write endpoints require auth) */
const productApi = {
  list: () => http.get('/api/products'),

  getById: (id) => http.get(`/api/products/${id}`).catch((err) => (err.status === 404 ? null : Promise.reject(err))),

  // categoryName is unused - the backend derives related products from the product's own category
  listRelated: (categoryName, excludeId, limit = 4) =>
    http.get(`/api/products/${excludeId}/related?limit=${limit}`),

  create: (payload) => http.post('/api/products', payload),

  update: (id, payload) => http.put(`/api/products/${id}`, payload),

  remove: (id) => http.delete(`/api/products/${id}`),

  // Fire-and-forget: a failed event log shouldn't ever break browsing/cart flows.
  logEvent: (id, type) => http.post(`/api/products/${id}/events`, { type }).catch(() => {}),

  getAnalytics: (id) => http.get(`/api/admin/products/${id}/analytics`),

  uploadImage: (file) => uploadFile('/api/admin/products/upload-image', file),
}

export default productApi
