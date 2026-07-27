export default function StockBadge({ stock }) {
  if (stock <= 0) return <span className="badge bg-red-100 text-red-600">Out of Stock</span>
  if (stock < 100) return <span className="badge bg-amber-100 text-amber-700">Low Stock</span>
  return <span className="badge bg-leaf-100 text-leaf-700">In Stock</span>
}

const OFFER_STYLES = {
  'Best Seller': 'bg-primary-500 text-white',
  'New Arrival': 'bg-leaf-600 text-white',
  'Limited Offer': 'bg-red-500 text-white',
  Organic: 'bg-leaf-100 text-leaf-700',
}

export function OfferBadge({ label }) {
  return <span className={`badge ${OFFER_STYLES[label] || 'bg-black/5 text-ink/70'}`}>{label}</span>
}
