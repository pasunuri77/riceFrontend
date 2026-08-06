import { http } from './client'

/** Maps to Spring Boot: GET /api/settings (public), GET/PUT/PATCH /api/admin/settings */
const settingsApi = {
  // Public, unauthenticated read - used by the storefront (cart/checkout) which
  // isn't logged in as admin and can't hit /api/admin/settings.
  get: () => http.get('/api/settings'),
  getAdmin: () => http.get('/api/admin/settings'),
  update: (settings) => http.patch('/api/admin/settings', settings),
}

export default settingsApi
