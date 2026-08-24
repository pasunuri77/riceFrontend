// Single source of truth for "what counts as low stock" - the backend has no
// admin-configurable threshold for this yet (see BACKEND_TODO), so this is a
// frontend-only judgment call. It used to be duplicated as three different
// magic numbers (100, 100, 30) across StockBadge/Dashboard/Admin Products;
// consolidated here so they can't drift out of sync with each other again.
export const LOW_STOCK_THRESHOLD = 100

// Separate, much smaller threshold for bag-count displays (Product Details'
// per-pack-size "Available: N bags"), since a bag count and a raw kg total are
// different units - reusing the kg threshold there would make everything read
// as "Low Stock". Same caveat: no backend-configurable value for this exists.
export const BAG_LOW_STOCK_THRESHOLD = 10

export function getStockStatus(stock, threshold = LOW_STOCK_THRESHOLD) {
  if (stock <= 0) return 'out'
  if (stock < threshold) return 'low'
  return 'in'
}

// Backend stock columns are 3 fixed slots (small/medium/large bag), named
// stock1Kg/stock5Kg/stock10Kg from before the lb switch. Which weight value
// lands in which slot has changed over time (kg-based products still stored
// as 1/5/10, lb-based products as 2/10/20) - matching by *position* within the
// product's own sorted weightOptions, rather than by the literal weight
// number, keeps both old and new product records working correctly.
const STOCK_FIELDS_BY_POSITION = ['stock1Kg', 'stock5Kg', 'stock10Kg']

export function stockFieldForWeight(weightOptions, weight) {
  const index = [...(weightOptions || [])].sort((a, b) => a - b).indexOf(weight)
  return STOCK_FIELDS_BY_POSITION[index]
}

// Same position-based approach as stockFieldForWeight, but for the bag-size
// text shown to shoppers/admin: older products still store weightOptions as
// 1/5/10 (kg-era values), newer ones as 2/10/20 (lb). The 3 slots are always
// small/medium/large regardless of which literal numbers a product has, so
// this always displays the current 2/10/20 lb sizing without needing every
// existing product record to be edited first.
const BAG_LB_BY_POSITION = [2, 10, 20]

export function bagSizeLabel(weightOptions, weight) {
  return `${bagSizeLb(weightOptions, weight) ?? weight} lb`
}

// Numeric counterpart to bagSizeLabel, for totals math (total weight, etc.)
// that needs the actual lb number rather than display text.
export function bagSizeLb(weightOptions, weight) {
  const index = [...(weightOptions || [])].sort((a, b) => a - b).indexOf(weight)
  return BAG_LB_BY_POSITION[index]
}

// Cart/order line items only ever stored the single chosen weight number, not
// the product's full weightOptions array, so there's no sibling context to
// resolve a position from (see bagSizeLabel above). For those call sites this
// direct value map is the best available fix for today's data, since every
// cart/order currently in the system predates the lb-sized options existing
// at all - they're all legacy 1/5/10 kg values. NOTE: this becomes ambiguous
// again once genuine new-scale 10lb orders exist (10 already meant "10kg/20lb"
// under the old scale) - if that matters, store the resolved lb label on the
// cart/order item itself at add-to-cart time instead of re-deriving it later.
const LEGACY_WEIGHT_TO_LB = { 1: 2, 5: 10, 10: 20 }

export function bagWeightLb(weight) {
  return LEGACY_WEIGHT_TO_LB[weight] ?? weight
}

// The return-request endpoints (GET .../returnable-items, return request
// items) label each line item server-side as e.g. "1kg Bag" - the raw
// kg-era number with the raw "kg" unit, neither of which matches the lb-only
// labeling used everywhere else in the app (2lb/10lb/20lb). No numeric
// weight is exposed on those DTOs to re-derive the label from independently,
// so this corrects the string itself: same LEGACY_WEIGHT_TO_LB mapping,
// applied to whatever "Nkg" prefix the backend sent. Already-correct "Nlb"
// labels pass through unchanged.
export function fixBagLabel(label) {
  if (!label) return label
  const match = label.match(/^(\d+)\s*kg\b/i)
  if (!match) return label
  const kg = Number(match[1])
  const lb = LEGACY_WEIGHT_TO_LB[kg] ?? kg
  return label.replace(/^\d+\s*kg\b/i, `${lb}lb`)
}
