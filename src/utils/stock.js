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
