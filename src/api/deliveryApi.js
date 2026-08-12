import { http } from './client'

/** Maps to Spring Boot: DeliveryController + AdminDeliveryController */
const deliveryApi = {
  check: (pincode) => http.get(`/api/delivery/check?pincode=${encodeURIComponent(pincode)}`),

  admin: {
    list: () => http.get('/api/admin/delivery/pincodes'),
    add: (pincodes) => http.post('/api/admin/delivery/pincodes', { pincodes }),
    remove: (pincode) => http.delete(`/api/admin/delivery/pincodes/${encodeURIComponent(pincode)}`),
  },
}

export default deliveryApi
