import { Link } from 'react-router-dom'
import { Scale, X, ShoppingCart } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Breadcrumb from '../../components/ui/Breadcrumb'
import RatingStars from '../../components/product/RatingStars'
import StockBadge from '../../components/product/StockBadge'
import { formatINR } from '../../utils/format'
import { useCompare } from '../../context/CompareContext'
import { useCart } from '../../context/CartContext'

const ROWS = [
  ['Brand', (p) => p.brand],
  ['Price/KG', (p) => formatINR(p.pricePerKg)],
  ['Rice Type', (p) => p.type],
  ['Origin', (p) => p.origin],
  ['Grain Length', (p) => p.grainLength],
  ['Rating', (p) => `${p.rating} ★ (${p.reviews})`],
  ['Stock', (p) => `${p.stock} kg`],
  ['Min Order', (p) => `${p.minOrder} kg`],
]

export default function Compare() {
  const { compareList, toggleCompare } = useCompare()
  const { addToCart } = useCart()

  return (
    <div className="container-app py-8">
      <Breadcrumb items={[{ label: 'Compare Products' }]} />
      <h1 className="section-title mb-1">Compare Products</h1>
      <p className="section-sub mb-6">Compare up to 3 rice products side by side</p>

      {compareList.length === 0 ? (
        <EmptyState icon={Scale} title="No products to compare" subtitle="Add up to 3 products from the shop page to compare them here." actionLabel="Browse Products" actionTo="/products" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 min-w-[600px]">
            <thead>
              <tr>
                <th className="w-40"></th>
                {compareList.map((p) => (
                  <th key={p.id} className="p-3 align-top">
                    <div className="card p-3 relative">
                      <button onClick={() => toggleCompare(p)} className="absolute top-2 right-2 text-ink/40 hover:text-red-500"><X className="w-4 h-4" /></button>
                      <img src={p.image} alt="" className="w-full aspect-square object-cover rounded-lg mb-2" />
                      <Link to={`/products/${p.id}`} className="text-sm font-semibold line-clamp-2 hover:text-primary-600">{p.name}</Link>
                      <button onClick={() => addToCart(p)} className="btn-primary w-full mt-2 text-xs py-1.5"><ShoppingCart className="w-3.5 h-3.5" /> Add to Cart</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, fn]) => (
                <tr key={label}>
                  <td className="px-3 py-3 text-sm font-semibold text-ink/50 border-t border-black/5">{label}</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-3 py-3 text-sm text-center border-t border-black/5">{fn(p)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="px-3 py-3 text-sm font-semibold text-ink/50 border-t border-black/5">In Stock</td>
                {compareList.map((p) => (
                  <td key={p.id} className="px-3 py-3 text-center border-t border-black/5"><StockBadge stock={p.stock} /></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
