import { http, uploadFile, getToken } from './client'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

/** Maps to Spring Boot: DeliveryController + AdminDeliveryController */
const deliveryApi = {
  // productId is optional - when given, checks that specific product's delivery
  // coverage (ProductDeliveryCoverage) instead of just the general serviceable-
  // pincodes list.
  check: (pincode, productId) => {
    const qs = new URLSearchParams({ pincode })
    if (productId) qs.set('productId', productId)
    return http.get(`/api/delivery/check?${qs.toString()}`)
  },

  admin: {
    list: () => http.get('/api/admin/delivery/pincodes'),
    add: (pincodes) => http.post('/api/admin/delivery/pincodes', { pincodes }),
    remove: (pincode) => http.delete(`/api/admin/delivery/pincodes/${encodeURIComponent(pincode)}`),
    uploadCsv: (file) => uploadFile('/api/admin/delivery/pincodes/upload', file),
    // A CSV download isn't a normal JSON API call, so it can't reuse http.get -
    // fetch it as a blob (still attaching the admin auth header) and hand the
    // caller a browser-downloadable URL.
    exportCsvUrl: async () => {
      const token = getToken()
      const res = await fetch(`${BASE_URL}/api/admin/delivery/pincodes/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to export pincodes')
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    },

    product: {
      list: (productId) => http.get(`/api/admin/delivery/products/${productId}/pincodes`),
      add: (productId, pincodes) => http.post(`/api/admin/delivery/products/${productId}/pincodes`, { pincodes }),
      remove: (productId, pincode) => http.delete(`/api/admin/delivery/products/${productId}/pincodes/${encodeURIComponent(pincode)}`),
    },
  },
}

export default deliveryApi
