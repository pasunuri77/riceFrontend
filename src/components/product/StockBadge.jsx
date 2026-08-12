import { getStockStatus } from '../../utils/stock'

const STOCK_STYLES = {
  out: { label: 'Out of Stock', className: 'bg-red-100 text-red-600' },
  low: { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' },
  in: { label: 'In Stock', className: 'bg-leaf-100 text-leaf-700' },
}

export default function StockBadge({ stock, threshold }) {
  const { label, className } = STOCK_STYLES[getStockStatus(stock, threshold)]
  return <span className={`badge ${className}`}>{label}</span>
}

// Promotional badges (Best Seller, Limited Offer, Organic, ...) are entirely
// backend-driven via `product.badges` (admin-editable free-text list) - this map
// only supplies a color for whatever label the backend sends, it doesn't decide
// which badges exist. An unrecognized label still renders with a neutral style
// rather than being hidden, since it's real admin-entered data either way.
const OFFER_STYLES = {
  'Best Seller': 'bg-primary-500 text-white',
  'New Arrival': 'bg-leaf-600 text-white',
  'Limited Offer': 'bg-red-500 text-white',
  Organic: 'bg-leaf-100 text-leaf-700',
}

export function OfferBadge({ label }) {
  return <span className={`badge ${OFFER_STYLES[label] || 'bg-black/5 text-ink/70'}`}>{label}</span>
}
