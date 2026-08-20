import { http } from './client'
import { displayOrderIdToDbId, refundMethodValue } from '../data/returnRequests'

const returnApi = {
  getReturnableItems: (orderId) => http.get(`/api/orders/${displayOrderIdToDbId(orderId)}/returnable-items`),

  submit: ({ orderId, reason, details, refundMethod, items }) =>
    http.post('/api/return-requests', {
      orderId: displayOrderIdToDbId(orderId),
      reason,
      details,
      refundMethod: refundMethodValue(refundMethod),
      items: items
        .filter((item) => item.returnQuantity > 0)
        .map((item) => ({ orderItemId: Number(item.id), quantity: item.returnQuantity })),
    }),

  listMine: () => http.get('/api/me/return-requests'),
  getMine: (id) => http.get(`/api/return-requests/${id}`),
  listAll: (status = 'all') => http.get(`/api/admin/return-requests?status=${encodeURIComponent(status)}`),
  getAdmin: (id) => http.get(`/api/admin/return-requests/${id}`),
  approve: (id, { adminNote, returnInstructions }) =>
    http.post(`/api/admin/return-requests/${id}/approve`, { adminNote, returnInstructions }),
  reject: (id, { reason, adminNote }) =>
    http.post(`/api/admin/return-requests/${id}/reject`, { reason, adminNote }),
  receive: (id, { receivedCondition, receivedNote }) =>
    http.post(`/api/admin/return-requests/${id}/receive`, { receivedCondition, receivedNote }),
  refund: (id, { refundReference, refundNote }) =>
    http.post(`/api/admin/return-requests/${id}/refund`, { refundReference, refundNote }),
}

export default returnApi
