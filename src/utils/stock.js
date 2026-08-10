// Single source of truth for "what counts as low stock" - the backend has no
// admin-configurable threshold for this yet (see BACKEND_TODO), so this is a
// frontend-only judgment call. It used to be duplicated as three different
// magic numbers (100, 100, 30) across StockBadge/Dashboard/Admin Products;
// consolidated here so they can't drift out of sync with each other again.
export const LOW_STOCK_THRESHOLD = 100

export function getStockStatus(stock) {
  if (stock <= 0) return 'out'
  if (stock < LOW_STOCK_THRESHOLD) return 'low'
  return 'in'
}
