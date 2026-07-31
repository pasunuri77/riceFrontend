import { http } from './client'

const settingsApi = {
  get: () => http.get('/api/admin/settings'),
  update: (settings) => http.patch('/api/admin/settings', settings),
}

export default settingsApi
