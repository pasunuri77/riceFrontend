import { http } from './client'

/** Maps to Spring Boot: GET/PUT /api/admin/settings */
const settingsApi = {
  get: () => http.get('/api/admin/settings'),

  update: (data) => http.put('/api/admin/settings', data),
}

export default settingsApi
