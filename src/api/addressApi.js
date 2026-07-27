import { http } from './client'

/** Maps to Spring Boot: GET/POST/PUT/DELETE /api/addresses, PATCH /api/addresses/:id/default */
const addressApi = {
  list: () => http.get('/api/addresses'),
  create: (addr) => http.post('/api/addresses', addr),
  update: (id, addr) => http.put(`/api/addresses/${id}`, addr),
  remove: (id) => http.delete(`/api/addresses/${id}`),
  setDefault: (id) => http.patch(`/api/addresses/${id}/default`),
}

export default addressApi
