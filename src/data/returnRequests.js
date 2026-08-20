const STORAGE_KEY = 'rb_return_requests'
const ORDER_SNAPSHOT_KEY = 'rb_return_order_snapshots'

export const RETURN_REASONS = [
  'Received wrong item',
  'Item is damaged',
  'Quality issue',
  'Not as described',
  'Changed my mind',
  'Other',
]

export const RETURN_STATUSES = {
  REQUESTED: 'PENDING',
  APPROVED: 'APPROVED',
  RECEIVED: 'RECEIVED',
  REFUNDED: 'REFUNDED',
  REJECTED: 'REJECTED',
}

export const RETURN_STATUS_LABELS = {
  PENDING: 'Return Requested',
  APPROVED: 'Return Approved',
  RECEIVED: 'Return Received',
  REFUNDED: 'Refund Processed',
  REJECTED: 'Return Rejected',
}

export const REFUND_METHODS = {
  original: 'ORIGINAL_PAYMENT_METHOD',
  'store-credit': 'STORE_CREDIT',
  paypal: 'PAYPAL',
  'gift-card': 'GIFT_CARD',
}

export const MOCK_RETURN_ORDER = {
  id: 'RBZ-2026-10028',
  customerId: 'mock-customer',
  customerName: 'Aarav Patel',
  riceName: 'Sona Masoori Rice',
  image: '',
  address: '4219 Oak Meadow Dr, Austin, TX 78759',
  date: '2026-08-12',
  deliveredAt: '2026-08-16',
  deliveryStatus: 'Delivered',
  paymentStatus: 'Paid',
  paymentMethod: 'card',
  paymentDisplay: 'Visa ending in 4242',
  subtotal: 21,
  deliveryCharge: 4.99,
  tax: 1.73,
  amount: 27.72,
  items: [
    { id: 'rbz-10028-2lb', name: 'Sona Masoori Rice', weight: 1, label: '2lb Bag', qty: 2, unitPrice: 1.5 },
    { id: 'rbz-10028-10lb', name: 'Sona Masoori Rice', weight: 5, label: '10lb Bag', qty: 2, unitPrice: 3 },
    { id: 'rbz-10028-20lb', name: 'Sona Masoori Rice', weight: 10, label: '20lb Bag', qty: 2, unitPrice: 6 },
  ],
}

export const PAYMENT_METHOD_LABELS = {
  upi: 'Digital Wallet',
  card: 'Credit / Debit Card',
  netbanking: 'Bank Transfer',
  cod: 'Cash on Delivery',
}

export function paymentMethodLabel(orderOrRequest) {
  return orderOrRequest?.paymentDisplay || PAYMENT_METHOD_LABELS[orderOrRequest?.paymentMethod] || orderOrRequest?.paymentMethod || 'Original payment method'
}

export function refundMethodValue(value) {
  return REFUND_METHODS[value] || value || REFUND_METHODS.original
}

export function returnStatusLabel(status) {
  return RETURN_STATUS_LABELS[status] || status || ''
}

export function displayOrderIdToDbId(orderId) {
  if (typeof orderId === 'number') return orderId
  const value = String(orderId || '')
  if (/^\d+$/.test(value)) return Number(value)
  const lastPart = value.substring(value.lastIndexOf('-') + 1)
  const displayNumber = Number(lastPart.replace(/\D/g, ''))
  return Number.isFinite(displayNumber) && displayNumber > 10000 ? displayNumber - 10000 : displayNumber
}

export function orderIdsMatch(displayId, apiOrderId) {
  return displayOrderIdToDbId(displayId) === Number(apiOrderId)
}

export function lineUnitPrice(item) {
  if (Number.isFinite(Number(item?.unitPrice))) return Number(item.unitPrice)
  return (item?.pricePerKg || 0) * (item?.weight || 0)
}

export function lineLabel(item) {
  if (item?.label) return item.label
  const weight = item?.weight === 1 ? 2 : item?.weight === 5 ? 10 : item?.weight === 10 ? 20 : item?.weight
  return weight ? `${weight}lb Bag` : 'Item'
}

export function returnableItems(order) {
  return (order?.items || []).map((item, index) => ({
    id: item.orderItemId || item.id || `${order.id}-${item.weight || index}`,
    productId: item.productId,
    name: item.productName || item.name || order.riceName || 'Rice item',
    label: item.variantName || lineLabel(item),
    imageUrl: item.imageUrl || item.image || order.image || '',
    weight: item.weight,
    unitPrice: lineUnitPrice(item),
    orderedQuantity: item.orderedQuantity ?? item.qty ?? item.quantity ?? 0,
    previouslyReturnedQuantity: item.previouslyReturnedQuantity || 0,
    returnableQuantity: item.returnableQuantity ?? item.qty ?? item.quantity ?? 0,
  }))
}

export function selectedRefund(items) {
  return items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.returnQuantity || item.quantity || 0), 0)
}

export function readReturnRequests() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeReturnRequests(requests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
  window.dispatchEvent(new Event('returns:changed'))
}

export function readReturnOrderSnapshots() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ORDER_SNAPSHOT_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveReturnOrderSnapshot(order) {
  if (!order?.id) return
  const snapshots = readReturnOrderSnapshots()
  localStorage.setItem(ORDER_SNAPSHOT_KEY, JSON.stringify({ ...snapshots, [order.id]: order }))
}

export function getReturnOrderSnapshot(orderId) {
  return readReturnOrderSnapshots()[orderId] || null
}

export function getReturnRequest(id) {
  return readReturnRequests().find((request) => request.id === id) || null
}

export function getReturnRequestForOrder(orderId) {
  return readReturnRequests().find((request) => orderIdsMatch(orderId, request.orderId)) || null
}

export function saveReturnRequest(request) {
  const requests = readReturnRequests()
  const idx = requests.findIndex((item) => item.id === request.id)
  const next = idx === -1 ? [request, ...requests] : requests.map((item) => (item.id === request.id ? request : item))
  writeReturnRequests(next)
  return request
}

export function updateReturnRequest(id, updates) {
  const current = getReturnRequest(id)
  if (!current) return null
  return saveReturnRequest({ ...current, ...updates, updatedAt: new Date().toISOString() })
}

export function createReturnRequest({ order, items, reason, details, photos }) {
  const now = new Date().toISOString()
  const selectedItems = items
    .filter((item) => item.returnQuantity > 0)
    .map((item) => ({
      id: item.id,
      name: item.name,
      label: item.label,
      unitPrice: item.unitPrice,
      orderedQuantity: item.orderedQuantity || item.returnableQuantity,
      quantity: item.returnQuantity,
      lineTotal: item.unitPrice * item.returnQuantity,
    }))

  const request = {
    id: `RET-${Date.now().toString().slice(-6)}`,
    orderId: order.id,
    customerId: order.customerId,
    customerName: order.customerName || 'RiceBazaar Customer',
    requestedOn: now,
    updatedAt: now,
    status: RETURN_STATUSES.REQUESTED,
    reason,
    details,
    photos,
    paymentMethod: order.paymentMethod,
    paymentDisplay: paymentMethodLabel(order),
    refundAmount: selectedItems.reduce((sum, item) => sum + item.lineTotal, 0),
    items: selectedItems,
    order,
  }

  return saveReturnRequest(request)
}

export function normalizeReturnRequest(request) {
  if (!request) return null
  return {
    id: String(request.id),
    returnNumber: request.returnNumber || `RET-${request.id}`,
    orderId: request.orderId,
    orderDisplayId: request.orderDisplayId || (request.order?.id ?? request.orderId),
    customerId: request.customerId,
    customerName: request.customerName || request.order?.customerName || 'Customer',
    requestedOn: request.submittedAt || request.requestedOn || request.createdAt,
    updatedAt: request.updatedAt,
    status: request.status,
    reason: request.reason,
    details: request.customerDetails || request.details,
    photos: request.photos || [],
    paymentMethod: request.refundMethod || request.paymentMethod,
    paymentDisplay: request.paymentDisplay || paymentMethodLabel(request),
    refundAmount: Number(request.refundAmount || 0),
    adminReason: request.adminReason,
    adminNote: request.adminNote,
    returnInstructions: request.returnInstructions,
    orderDate: request.orderDate,
    deliveredAt: request.deliveredAt,
    approvedAt: request.approvedAt,
    rejectedAt: request.rejectedAt,
    receivedAt: request.receivedAt,
    receivedCondition: request.receivedCondition,
    receivedNote: request.receivedNote,
    refundedAt: request.refundProcessedAt || request.refundedAt,
    refundReference: request.refundReference,
    refundNote: request.refundNote,
    items: (request.items || []).map((item) => ({
      id: String(item.id || item.orderItemId),
      orderItemId: item.orderItemId,
      name: item.productName || item.name,
      label: item.variantName || item.label,
      unitPrice: Number(item.unitPrice || 0),
      orderedQuantity: item.orderedQuantity,
      quantity: item.requestedQuantity ?? item.quantity ?? 0,
      approvedQuantity: item.approvedQuantity,
      lineTotal: Number(item.refundAmount || item.lineTotal || 0),
    })),
    order: request.order,
  }
}

export function normalizeReturnRequests(requests) {
  return (Array.isArray(requests) ? requests : []).map(normalizeReturnRequest).filter(Boolean)
}

export function orderWithFixture(orders) {
  const list = Array.isArray(orders) ? orders : []
  if (list.some((order) => order.id === MOCK_RETURN_ORDER.id)) return list
  return [MOCK_RETURN_ORDER, ...list]
}
