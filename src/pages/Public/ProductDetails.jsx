import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart, Minus, Plus, Truck, ShieldCheck, RotateCcw, ZoomIn, PackageCheck, Undo2, Star } from 'lucide-react'
import productApi from '../../api/productApi'
import reviewApi from '../../api/reviewApi'
import ProductCard from '../../components/product/ProductCard'
import ProductImage from '../../components/product/ProductImage'
import RatingStars from '../../components/product/RatingStars'
import StockBadge, { OfferBadge } from '../../components/product/StockBadge'
import Breadcrumb from '../../components/ui/Breadcrumb'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SubmitButton from '../../components/ui/SubmitButton'
import { formatINR, estimatedDelivery } from '../../utils/format'
import { safeImageUrl } from '../../utils/sanitize'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import { PackageSearch } from 'lucide-react'
import { TextSkeleton } from '../../components/ui/Skeleton'
import useRecentlyViewed, { trackRecentlyViewed } from '../../hooks/useRecentlyViewed'

const TABS = ['specs', 'reviews', 'shipping']
const TAB_LABELS = { specs: 'Specifications', shipping: 'Shipping & Returns' }

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState(null)
  const [productReviews, setProductReviews] = useState([])
  const [related, setRelated] = useState([])
  const [zoomOpen, setZoomOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHoverRating, setReviewHoverRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const [weight, setWeight] = useState(null)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('specs')

  const recentlyViewed = useRecentlyViewed(product?.id)

  useEffect(() => {
    setLoading(true)
    productApi.getById(id).then((p) => {
      setProduct(p)
      setWeight(p?.weightOptions[0])
      setQty(1)
      setLoading(false)
      if (p) {
        trackRecentlyViewed(p)
        reviewApi.listByProduct(p.id).then(setProductReviews).catch(() => setProductReviews([]))
        productApi.listRelated(p.category, p.id).then(setRelated).catch(() => setRelated([]))
      }
    }).catch(() => {
      setProduct(null)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="container-app py-8">
        <TextSkeleton className="h-4 w-64 mb-4" />
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="skeleton aspect-square rounded-2xl2" />
          <div className="space-y-4">
            <TextSkeleton className="h-4 w-24" />
            <TextSkeleton className="h-8 w-3/4" />
            <TextSkeleton className="h-5 w-1/3" />
            <TextSkeleton className="h-10 w-1/2" />
            <TextSkeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return <EmptyState icon={PackageSearch} title="Product not found" subtitle="This rice product may have been removed." actionLabel="Back to Shop" actionTo="/products" />
  }

  // Can't add more units than the stock on hand allows for the selected pack size.
  const maxQty = Math.max(1, Math.floor(product.stock / weight))
  const total = product.pricePerKg * weight * qty
  const outOfStock = product.stock <= 0

  const buyNow = () => {
    addToCart(product, weight, qty)
    navigate('/cart')
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (reviewRating < 1) { showToast('Please select a star rating', 'error'); return }
    if (!reviewComment.trim()) { showToast('Please write a comment', 'error'); return }
    setSubmittingReview(true)
    try {
      await reviewApi.submit(product.id, { rating: reviewRating, comment: reviewComment.trim() })
      // The backend recomputes the product's aggregate rating/review count on
      // submit - refetch the product too, not just the review list, so the
      // star rating badge updates immediately instead of needing a page reload.
      const [fresh, freshProduct] = await Promise.all([
        reviewApi.listByProduct(product.id),
        productApi.getById(product.id),
      ])
      setProductReviews(fresh)
      setProduct(freshProduct)
      setReviewRating(0)
      setReviewComment('')
      showToast('Thanks for your review!', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to submit review', 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <div className="container-app py-8 pb-40 lg:pb-8">
      <Breadcrumb items={[{ label: 'Shop', to: '/products' }, { label: product.name }]} />

      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="group relative aspect-square rounded-2xl2 overflow-hidden bg-primary-50 mb-3 w-full block"
            aria-label="Zoom product image"
          >
            <ProductImage src={product.image} alt={product.name} className="w-full h-full object-cover" iconClassName="w-16 h-16" />
            {safeImageUrl(product.image) && (
              <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-card">
                <ZoomIn className="w-4 h-4 text-ink/70" aria-hidden="true" />
              </span>
            )}
          </button>
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
                <button
                  key={w}
                  onClick={() => {
                    setWeight(w)
                    // The per-unit cap changes with pack size, so re-clamp the current quantity to it.
                    const newMax = Math.max(1, Math.floor(product.stock / w))
                    setQty((q) => Math.min(q, newMax))
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border ${weight === w ? 'bg-primary-500 text-white border-primary-500' : 'border-black/10 hover:border-primary-300'}`}
                >
                  {w} kg
                </button>
              ))}
            </div>

            <p className="label-field">Quantity</p>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center border border-black/10 rounded-lg">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="p-2.5 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed"><Minus className="w-4 h-4" aria-hidden="true" /></button>
                <span className="w-10 text-center font-semibold" aria-live="polite">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Increase quantity" className="p-2.5 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed"><Plus className="w-4 h-4" aria-hidden="true" /></button>
              </div>
              <div className="card px-4 py-2.5 bg-primary-50 border-0">
                <p className="text-[11px] text-ink/50">Total Price</p>
                <p className="font-bold text-primary-700">{formatINR(total)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => addToCart(product, weight, qty)} disabled={outOfStock} className="btn-primary flex-1"><ShoppingCart className="w-4 h-4" /> Add to Cart</button>
              <button onClick={buyNow} disabled={outOfStock} className="btn-secondary flex-1">Buy Now</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 text-center">
            <div className="card p-3"><Truck className="w-5 h-5 mx-auto text-primary-600 mb-1" /><p className="text-[11px] font-semibold">Est. Delivery</p><p className="text-[10px] text-ink/40">{estimatedDelivery()}</p></div>
            <div className="card p-3"><ShieldCheck className="w-5 h-5 mx-auto text-primary-600 mb-1" /><p className="text-[11px] font-semibold">Quality Assured</p><p className="text-[10px] text-ink/40">Lab tested</p></div>
            <div className="card p-3"><RotateCcw className="w-5 h-5 mx-auto text-primary-600 mb-1" /><p className="text-[11px] font-semibold">Easy Returns</p><p className="text-[10px] text-ink/40">7-day policy</p></div>
          </div>
        </motion.div>
      </div>

      {/* Tabs: Specs / Reviews / Shipping */}
      <div className="mt-14">
        <div className="flex gap-6 border-b border-black/10 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`pb-3 px-1 text-sm font-bold capitalize border-b-2 transition whitespace-nowrap ${tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-ink/40'}`}>
              {t === 'reviews' ? `Reviews (${productReviews.length})` : TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === 'specs' && (
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
        )}

        {tab === 'reviews' && (
          <div className="py-6 space-y-4">
            {user ? (
              <form onSubmit={submitReview} className="card p-4">
                <p className="font-semibold text-sm mb-2">Write a Review</p>
                <div className="flex items-center gap-1 mb-3" onMouseLeave={() => setReviewHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      onMouseEnter={() => setReviewHoverRating(s)}
                      aria-label={`Rate ${s} out of 5 stars`}
                      className="p-0.5"
                    >
                      <Star className={`w-6 h-6 ${s <= (reviewHoverRating || reviewRating) ? 'fill-primary-400 text-primary-400' : 'text-black/15'}`} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  placeholder="Share your experience with this rice..."
                  className="input-field mb-3"
                />
                <SubmitButton loading={submittingReview} className="btn-primary text-sm">Submit Review</SubmitButton>
              </form>
            ) : (
              <div className="card p-4 text-sm text-ink/60 flex items-center justify-between flex-wrap gap-2">
                <span>Have you tried this rice? Share your experience.</span>
                <Link to="/login" state={{ from: location }} className="text-primary-600 font-semibold hover:underline">Log in to write a review</Link>
              </div>
            )}

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

        {tab === 'shipping' && (
          <div className="py-6 grid sm:grid-cols-2 gap-5 text-sm">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-2 font-bold"><PackageCheck className="w-4 h-4 text-primary-600" aria-hidden="true" /> Shipping Policy</div>
              <p className="text-ink/60 leading-relaxed">Orders are dispatched within 1-2 business days and delivered pan-India, typically within 3-7 business days depending on your location. Estimated delivery is shown at checkout.</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-2 font-bold"><Undo2 className="w-4 h-4 text-primary-600" aria-hidden="true" /> Return Policy</div>
              <p className="text-ink/60 leading-relaxed">Unopened, unused packs can be returned within 7 days of delivery. See our <Link to="/terms" className="text-primary-600 font-semibold">Terms &amp; Conditions</Link> for full details.</p>
            </div>
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

      {recentlyViewed.length > 0 && (
        <div className="mt-14">
          <h2 className="section-title mb-6">Recently Viewed</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            {recentlyViewed.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      )}

      <Modal open={zoomOpen} onClose={() => setZoomOpen(false)} title={product.name} maxWidth="max-w-2xl">
        <ProductImage src={product.image} alt={product.name} className="w-full rounded-xl object-contain max-h-[70vh]" iconClassName="w-20 h-20" />
      </Modal>

      {/* Sticky mobile add-to-cart bar - sits above the site-wide BottomNav (also
          fixed bottom-0, z-40), not on top of it. */}
      <div className="lg:hidden fixed bottom-16 inset-x-0 z-30 bg-white border-t border-black/10 px-4 py-3 flex items-center gap-3 shadow-cardHover">
        <div className="min-w-0">
          <p className="text-[11px] text-ink/40">Total</p>
          <p className="font-extrabold text-primary-700 truncate">{formatINR(total)}</p>
        </div>
        <button onClick={() => addToCart(product, weight, qty)} disabled={outOfStock} className="btn-primary flex-1 justify-center">
          <ShoppingCart className="w-4 h-4" aria-hidden="true" /> {outOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
