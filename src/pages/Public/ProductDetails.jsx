import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Minus, Plus, Truck, ShieldCheck, RotateCcw, Scale } from 'lucide-react'
import productApi from '../../api/productApi'
import reviewApi from '../../api/reviewApi'
import ProductCard from '../../components/product/ProductCard'
import RatingStars from '../../components/product/RatingStars'
import StockBadge, { OfferBadge } from '../../components/product/StockBadge'
import Breadcrumb from '../../components/ui/Breadcrumb'
import EmptyState from '../../components/ui/EmptyState'
import { formatINR, estimatedDelivery } from '../../utils/format'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useCompare } from '../../context/CompareContext'
import { PackageSearch } from 'lucide-react'

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { isComparing, toggleCompare } = useCompare()

  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState(null)
  const [productReviews, setProductReviews] = useState([])
  const [related, setRelated] = useState([])

  const [weight, setWeight] = useState(null)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('specs')

  useEffect(() => {
    setLoading(true)
    productApi.getById(id).then((p) => {
      setProduct(p)
      setWeight(p?.weightOptions[0])
      setQty(1)
      setLoading(false)
      if (p) {
        reviewApi.listByProduct(p.id).then(setProductReviews).catch(() => setProductReviews([]))
        productApi.listRelated(p.category, p.id).then(setRelated).catch(() => setRelated([]))
      }
    }).catch(() => {
      setProduct(null)
      setLoading(false)
    })
  }, [id])

  if (loading) return null

  if (!product) {
    return <EmptyState icon={PackageSearch} title="Product not found" subtitle="This rice product may have been removed." actionLabel="Back to Shop" actionTo="/products" />
  }

  const total = product.pricePerKg * weight * qty

  const buyNow = () => {
    addToCart(product, weight, qty)
    navigate('/cart')
  }

  return (
    <div className="container-app py-8">
      <Breadcrumb items={[{ label: 'Shop', to: '/products' }, { label: product.name }]} />

      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <div className="aspect-square rounded-2xl2 overflow-hidden bg-primary-50 mb-3">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex gap-2 mb-2">{product.badges.map((b) => <OfferBadge key={b} label={b} />)}</div>
          <p className="text-primary-600 font-bold text-sm uppercase tracking-wide">{product.brand}</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-ink mt-1">{product.name}</h1>
          <div className="mt-2"><RatingStars rating={product.rating} reviews={product.reviews} size="w-4 h-4" /></div>

          <div className="flex items-center gap-3 mt-4">
            <span className="text-3xl font-extrabold font-display text-ink">{formatINR(product.pricePerKg)}</span>
            <span className="text-ink/40">/kg</span>
            {product.mrp > product.pricePerKg && <span className="text-lg text-ink/35 line-through">{formatINR(product.mrp)}</span>}
            {product.mrp > product.pricePerKg && (
              <span className="badge bg-leaf-100 text-leaf-700">{Math.round((1 - product.pricePerKg / product.mrp) * 100)}% OFF</span>
            )}
          </div>

          <p className="text-ink/60 text-sm mt-4 leading-relaxed">{product.description}</p>

          <div className="grid grid-cols-2 gap-4 mt-5 text-sm">
            <div><span className="text-ink/40">Origin:</span> <span className="font-semibold">{product.origin}</span></div>
            <div><span className="text-ink/40">Grain Length:</span> <span className="font-semibold">{product.grainLength}</span></div>
            <div><span className="text-ink/40">Available Stock:</span> <span className="font-semibold">{product.stock} kg</span></div>
            <div><span className="text-ink/40">Min / Max Order:</span> <span className="font-semibold">{product.minOrder}kg – {product.maxOrder}kg</span></div>
          </div>
          <div className="mt-2"><StockBadge stock={product.stock} /></div>

          <div className="border-t border-black/5 mt-6 pt-6">
            <p className="label-field">Select Weight</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {product.weightOptions.map((w) => (
                <button key={w} onClick={() => setWeight(w)} className={`px-4 py-2 rounded-lg text-sm font-semibold border ${weight === w ? 'bg-primary-500 text-white border-primary-500' : 'border-black/10 hover:border-primary-300'}`}>
                  {w} kg
                </button>
              ))}
            </div>

            <p className="label-field">Quantity</p>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center border border-black/10 rounded-lg">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5 hover:bg-primary-50"><Minus className="w-4 h-4" /></button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="p-2.5 hover:bg-primary-50"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="card px-4 py-2.5 bg-primary-50 border-0">
                <p className="text-[11px] text-ink/50">Total Price</p>
                <p className="font-bold text-primary-700">{formatINR(total)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => addToCart(product, weight, qty)} disabled={product.stock <= 0} className="btn-primary flex-1"><ShoppingCart className="w-4 h-4" /> Add to Cart</button>
              <button onClick={buyNow} disabled={product.stock <= 0} className="btn-secondary flex-1">Buy Now</button>
              <button onClick={() => toggleWishlist(product)} className={`btn-outline px-3.5 ${isWishlisted(product.id) ? '!border-red-400 !text-red-500' : ''}`}>
                <Heart className={`w-4 h-4 ${isWishlisted(product.id) ? 'fill-red-500' : ''}`} />
              </button>
              <button onClick={() => toggleCompare(product)} className={`btn-outline px-3.5 ${isComparing(product.id) ? '!border-primary-500' : ''}`}>
                <Scale className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 text-center">
            <div className="card p-3"><Truck className="w-5 h-5 mx-auto text-primary-600 mb-1" /><p className="text-[11px] font-semibold">Est. Delivery</p><p className="text-[10px] text-ink/40">{estimatedDelivery()}</p></div>
            <div className="card p-3"><ShieldCheck className="w-5 h-5 mx-auto text-primary-600 mb-1" /><p className="text-[11px] font-semibold">Quality Assured</p><p className="text-[10px] text-ink/40">Lab tested</p></div>
            <div className="card p-3"><RotateCcw className="w-5 h-5 mx-auto text-primary-600 mb-1" /><p className="text-[11px] font-semibold">Easy Returns</p><p className="text-[10px] text-ink/40">7-day policy</p></div>
          </div>
        </motion.div>
      </div>

      {/* Tabs: Specs / Reviews */}
      <div className="mt-14">
        <div className="flex gap-6 border-b border-black/10">
          {['specs', 'reviews'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`pb-3 px-1 text-sm font-bold capitalize border-b-2 transition ${tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-ink/40'}`}>
              {t === 'specs' ? 'Specifications' : `Reviews (${productReviews.length})`}
            </button>
          ))}
        </div>

        {tab === 'specs' ? (
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-3 py-6 text-sm">
            {[
              ['Brand', product.brand], ['Rice Type', product.type], ['Category', product.category],
              ['Origin State', product.origin], ['Grain Length', product.grainLength],
              ['Available Stock', `${product.stock} kg`], ['Minimum Order', `${product.minOrder} kg`], ['Maximum Order', `${product.maxOrder} kg`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-black/5 py-2">
                <span className="text-ink/50">{k}</span><span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 space-y-4">
            {productReviews.length === 0 && <p className="text-sm text-ink/40">No reviews yet for this product.</p>}
            {productReviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{r.name}</p>
                  <span className="text-xs text-ink/40">{r.date}</span>
                </div>
                <RatingStars rating={r.rating} showValue={false} />
                <p className="text-sm text-ink/60 mt-2">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="section-title mb-6">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      )}
    </div>
  )
}
