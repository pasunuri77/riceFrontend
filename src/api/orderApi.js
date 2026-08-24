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


  // Reason is required (see CancelOrderModal) - the backend records who
  // cancelled and stamps the order with their role/name so the UI can show
  // "Cancelled by Admin/Employee" instead of leaving it ambiguous.
  cancel: (id, reason) => http.patch(`/api/orders/${id}/cancel`, { reason }),

  updatePaymentStatus: (id, status) =>
    http.patch(`/api/admin/orders/${id}/payment-status`, { status }),

  // `reason` is only sent when cancelling (status === 'Cancelled') - every
  // other delivery-status transition doesn't need one, so callers simply omit
  // it there.
  updateDeliveryStatus: (id, status, reason) =>
    http.patch(`/api/admin/orders/${id}/delivery-status`, reason !== undefined ? { status, reason } : { status }),

  // Admin-only "Confirm Order" action - transitions a Pending order to Processing.
  // Kept as its own endpoint (rather than reusing updateDeliveryStatus) so the
  // backend can enforce the Pending -> Processing transition specifically and
  // reject confirming an order that isn't currently Pending.
  confirmOrder: (id) => http.patch(`/api/admin/orders/${id}/confirm`),

  // Processes a refund for a cancelled, prepaid (non-COD) order - product
  // amount only (tax/delivery excluded), same policy as a product return.
  // No refundReference here - there's no real payment gateway integrated yet
  // to generate one from, so nothing meaningful to send. Not yet implemented
  // on the backend (see backend prompt); this is wired ahead of time so it
  // starts working the moment that endpoint exists, with no further frontend
  // changes.
  refundCancelledOrder: (id, { refundNote }) =>
    http.post(`/api/admin/orders/${id}/refund`, { refundNote }),

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
