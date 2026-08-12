import { http, uploadFile } from './client'

/** Maps to Spring Boot: GET /api/settings (public), GET/PUT/PATCH /api/admin/settings */
const settingsApi = {
  // Public, unauthenticated read - used by the storefront (cart/checkout) which
  // isn't logged in as admin and can't hit /api/admin/settings.
  get: () => http.get('/api/settings'),
  getAdmin: () => http.get('/api/admin/settings'),
  update: (settings) => http.patch('/api/admin/settings', settings),

  // There's no dedicated settings-logo upload route yet, but CloudinaryService
  // on the backend is generic (just uploads whatever file it's given), so the
  // existing product-image endpoint works fine here too - reused rather than
  // waiting on a new route that would do the exact same thing.
  uploadLogo: (file) => uploadFile('/api/admin/products/upload-image', file),
}

export default settingsApi
