import { http } from './client'

/** Maps to Spring Boot: AdminDeliveryRunController (/api/admin/delivery-runs, /api/admin/orders/:id/delivery-proof) */
const deliveryRunApi = {
  list: () => http.get('/api/admin/delivery-runs'),

  // includeOrders isn't a real query param the backend reads today - getById
  // always returns orders per DeliveryRunResponse. Kept as a plain get for now.
  getById: (id) => http.get(`/api/admin/delivery-runs/${id}`),

  create: ({ runNumber, driverId, vehicleInfo, notes, orderIds }) =>
    http.post('/api/admin/delivery-runs', { runNumber, driverId, vehicleInfo, notes, orderIds }),

  update: (id, { driverId, vehicleInfo, notes, status, orderIds }) =>
    http.put(`/api/admin/delivery-runs/${id}`, { driverId, vehicleInfo, notes, status, orderIds }),

  getOrderProof: (orderId) => http.get(`/api/admin/orders/${orderId}/delivery-proof`),

  // Not built on the backend yet - there's currently no endpoint that lists
  // just the DELIVERY_PARTNER-role users (the admin staff list only returns
  // ADMIN/EMPLOYEE). Wired ahead of time against the endpoint asked for in
  // the backend prompt, so the "Assign Driver" picker starts working the
  // moment it exists, with no further frontend changes.
  listDeliveryPartners: () => http.get('/api/admin/delivery-partners'),
}

export default deliveryRunApi
