import { http, uploadFormData } from './client'

/** Maps to Spring Boot: DeliveryPartnerController (/api/delivery-partner/**) */
const deliveryPartnerApi = {
  listRuns: () => http.get('/api/delivery-partner/runs'),

  getRun: (id) => http.get(`/api/delivery-partner/runs/${id}`),

  // Flattened across every run currently assigned to this partner - already
  // redacted server-side (no customer name/phone/email), see
  // DeliveryPartnerOrderResponse.
  listOrders: () => http.get('/api/delivery-partner/orders'),

  // Multipart - `file` (the delivery-proof photo) is required by the backend;
  // `notes`/`latitude`/`longitude` are optional extras appended alongside it.
  // Marks the order Delivered as a side effect of a successful upload - there
  // is no separate "mark delivered" call.
  deliver: (orderId, { file, notes, latitude, longitude }) => {
    const formData = new FormData()
    formData.append('file', file)
    if (notes) formData.append('notes', notes)
    if (latitude != null) formData.append('latitude', latitude)
    if (longitude != null) formData.append('longitude', longitude)
    return uploadFormData(`/api/delivery-partner/orders/${orderId}/deliver`, formData)
  },

  // Not live on the backend yet (see backend prompt) - lets a partner view the
  // proof photo/notes they already uploaded for one of their own delivered
  // orders, same DeliveryProofResponse shape the admin proof view already
  // uses. Deliveries.jsx catches the 404 gracefully until this lands.
  getOrderProof: (orderId) => http.get(`/api/delivery-partner/orders/${orderId}/proof`),
}

export default deliveryPartnerApi
