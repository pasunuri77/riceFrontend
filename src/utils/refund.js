// RiceBazaar's refund policy for a cancelled order matches the product-return
// policy: only the product amount is refundable, not delivery charges or tax
// (the same rule already shown to customers on the return-request flow -
// "Delivery charges and tax are not refundable"). A cancelled order never
// shipped, but the policy is still "product amount only," not "everything."
export function refundableAmount(order) {
  const amount = order?.amount || 0
  const tax = order?.tax || 0
  const deliveryCharge = order?.deliveryCharge || 0
  return Math.max(0, amount - tax - deliveryCharge)
}
