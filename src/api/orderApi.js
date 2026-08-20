import { http } from './client'

/** Maps to Spring Boot:
 * GET /api/orders (mine)
 * GET /api/admin/orders (admin)
 * GET /api/orders/:id
 * POST /api/orders

 * PATCH /api/admin/orders/:id/payment-status
 * PATCH /api/admin/orders/:id/delivery-status
 * PATCH /api/admin/orders/:id/confirm
 * POST /api/admin/orders (book on behalf of a customer)
 */
const orderApi = {
  listMine: () => http.get('/api/orders'),

  listAll: () => http.get('/api/admin/orders'),

  // Confirmed live: GET /api/orders/:id expects the full "ORD10013" display id
  // string, same as every other per-order endpoint below (cancel, confirm,
  // status updates) - it parses the display id server-side itself. Passing a
  // bare converted number here (e.g. 13) gets a 400 "Invalid order id" back,
  // which the caller then wrongly reports as "order not found".
  getById: (id) => http.get(`/api/orders/${id}`),

  create: ({ address, deliveryZipCode, paymentMethod, items, couponCode, notes }) =>
    http.post('/api/orders', { address, deliveryZipCode, paymentMethod, items, couponCode, notes }),


  cancel: (id) => http.patch(`/api/orders/${id}/cancel`),

  updatePaymentStatus: (id, status) =>
    http.patch(`/api/admin/orders/${id}/payment-status`, { status }),

  updateDeliveryStatus: (id, status) =>
    http.patch(`/api/admin/orders/${id}/delivery-status`, { status }),

  // Admin-only "Confirm Order" action - transitions a Pending order to Processing.
  // Kept as its own endpoint (rather than reusing updateDeliveryStatus) so the
  // backend can enforce the Pending -> Processing transition specifically and
  // reject confirming an order that isn't currently Pending.
  confirmOrder: (id) => http.patch(`/api/admin/orders/${id}/confirm`),

  // Admin creating/booking an order on behalf of an existing or newly-added
  // customer. customerId identifies who the order belongs to; everything else
  // mirrors the shape of the customer-facing create() call above. orderType
  // ('online' | 'offline') tells the backend whether to apply a delivery
  // charge - an offline (in-store/walk-in) order has no address and no
  // delivery charge, only product cost + tax, same as online minus delivery.
  createForCustomer: ({ customerId, orderType, address, paymentMethod, items, notes, markAsPaid, couponCode }) =>
    http.post('/api/admin/orders', { customerId, orderType, address, paymentMethod, items, notes, markAsPaid, couponCode }),
}

export default orderApi
