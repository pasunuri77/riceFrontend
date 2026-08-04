import { http } from './client'

/** Maps to Spring Boot: GET /api/settings, GET/PUT/PATCH /api/admin/settings */
const settingsApi = {
  get: () => http.get('/api/settings'),
  getAdmin: () => http.get('/api/admin/settings'),
  update: (settings) => http.patch('/api/admin/settings', settings),
  // Public, unauthenticated read of the same store settings - used by the storefront
  // (cart/checkout) which isn't logged in as admin and can't hit /api/admin/settings.
  getPublic: () => http.get('/api/settings'),
}

export default settingsApi
