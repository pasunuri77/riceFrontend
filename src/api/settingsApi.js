import { http } from './client'

/** Maps to Spring Boot: GET/PUT/PATCH /api/admin/settings */
const settingsApi = {
  get: () => http.get('/api/settings'),
  getAdmin: () => http.get('/api/admin/settings'),
  update: (settings) => http.patch('/api/admin/settings', settings),
}

export default settingsApi
