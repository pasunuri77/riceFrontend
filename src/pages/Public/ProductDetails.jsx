import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart, Minus, Plus, Truck, ShieldCheck, RotateCcw, ZoomIn, PackageCheck, Undo2 } from 'lucide-react'
import productApi from '../../api/productApi'
import ProductCard from '../../components/product/ProductCard'
import ProductImage from '../../components/product/ProductImage'
import StockBadge, { OfferBadge } from '../../components/product/StockBadge'
import Breadcrumb from '../../components/ui/Breadcrumb'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { formatUSD, estimatedDelivery } from '../../utils/format'
import { BAG_LOW_STOCK_THRESHOLD, stockFieldForWeight, bagSizeLabel, bagSizeLb } from '../../utils/stock'
import { safeImageUrl } from '../../utils/sanitize'
import { useCart } from '../../context/CartContext'
import { PackageSearch } from 'lucide-react'
import { TextSkeleton } from '../../components/ui/Skeleton'

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addMultipleToCart } = useCart()

  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [zoomOpen, setZoomOpen] = useState(false)

  // Independent quantity per bag size, keyed by weight - lets the shopper build
  // up an order across every size (2lb, 10lb, 20lb, ...) before a single
  // combined "Add Selected Bags to Cart" action, instead of one size at a time.
  const [quantities, setQuantities] = useState({})

  useEffect(() => {
    setLoading(true)
    productApi.getById(id).then((p) => {
      setProduct(p)
      setQuantities(Object.fromEntries((p?.weightOptions || []).map((w) => [w, 0])))
      setLoading(false)
      if (p) {
        productApi.listRelated(p.category, p.id).then(setRelated).catch(() => setRelated([]))
        productApi.logEvent(p.id, 'view')
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

  // Rice ships as pre-packed bags, not loose lb - each bag size has its own
  // real, independent stock column on the backend (stock1Kg/stock5Kg/stock10Kg),
  // so this is the count for that specific pack size, not derived from a shared
  // pool. Which column a given weight maps to is resolved by position
  // (stockFieldForWeight), not the literal number, so it works for both older
  // kg-based products (1/5/10) and newer lb-based ones (2/10/20).
  const availableBagsFor = (w) => Math.max(0, product[stockFieldForWeight(product.weightOptions, w)] ?? 0)
  const pricePerBagFor = (w) => product.pricePerKg * w

  const setQtyFor = (w, next) => {
    const clamped = Math.max(0, Math.min(availableBagsFor(w), next))
    setQuantities((q) => ({ ...q, [w]: clamped }))
  }

  const selections = product.weightOptions
    .map((w) => ({ weight: w, qty: quantities[w] || 0 }))
    .filter((s) => s.qty > 0)
  const totalBags = selections.reduce((sum, s) => sum + s.qty, 0)
  const totalWeightLb = selections.reduce((sum, s) => sum + bagSizeLb(product.weightOptions, s.weight) * s.qty, 0)
  const estimatedSubtotal = selections.reduce((sum, s) => sum + pricePerBagFor(s.weight) * s.qty, 0)

  const handleAddSelected = () => {
    if (selections.length === 0) return
    addMultipleToCart(product, selections)
    productApi.logEvent(product.id, 'add-to-cart')
    setQuantities(Object.fromEntries(product.weightOptions.map((w) => [w, 0])))
  }

  const buyNow = () => {
    handleAddSelected()
    navigate('/cart')
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

          <p className="text-ink/60 text-sm mt-4 leading-relaxed">{product.description}</p>

          <div className="border-t border-black/5 mt-6 pt-6">
            <p className="label-field mb-3">Select Bag Sizes &amp; Quantities</p>
            <div className="space-y-3">
              {product.weightOptions.map((w) => {
                const available = availableBagsFor(w)
                const qty = quantities[w] || 0
                const out = available <= 0
                return (
                  <div key={w} className={`card p-4 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap ${out ? 'opacity-60' : ''}`}>
                    <div className="min-w-0">
                      <p className="font-bold text-sm">{bagSizeLabel(product.weightOptions, w)} Bag</p>
                      <p className="text-ink/60 text-sm mt-0.5">{formatUSD(pricePerBagFor(w))} / bag</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-ink/40">{available} available</span>
                        <StockBadge stock={available} threshold={BAG_LOW_STOCK_THRESHOLD} />
                      </div>
                    </div>
                    <div className="flex items-center border border-black/10 rounded-lg shrink-0">
                      <button
                        onClick={() => setQtyFor(w, qty - 1)}
                        disabled={qty <= 0}
                        aria-label={`Decrease quantity for ${bagSizeLabel(product.weightOptions, w)} bag`}
                        className="p-2.5 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <span className="w-10 text-center font-semibold" aria-live="polite">{qty}</span>
                      <button
                        onClick={() => setQtyFor(w, qty + 1)}
                        disabled={qty >= available}
                        aria-label={`Increase quantity for ${bagSizeLabel(product.weightOptions, w)} bag`}
                        className="p-2.5 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalBags > 0 && (
              <div className="card p-4 mt-4 bg-primary-50 border-0 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm text-ink/60 space-y-0.5">
                  <p>Total Bags: <span className="font-bold text-ink">{totalBags}</span></p>
                  <p>Total Weight: <span className="font-bold text-ink">{totalWeightLb} lb</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-ink/50">Estimated Subtotal</p>
                  <p className="font-bold text-primary-700 text-lg">{formatUSD(estimatedSubtotal)}</p>
                </div>
              </div>
            )}

            <p className="text-xs text-ink/50 mt-3 mb-2">
              {totalBags > 0 ? `${totalBags} bag${totalBags === 1 ? '' : 's'} selected` : 'Select at least one bag size and quantity.'}
            </p>

            <div className="flex flex-wrap gap-3">
              <button onClick={handleAddSelected} disabled={totalBags === 0} className="btn-primary flex-1">
                <ShoppingCart className="w-4 h-4" aria-hidden="true" /> Add to Cart
              </button>
              <button onClick={buyNow} disabled={totalBags === 0} className="btn-secondary flex-1">Buy Now</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 text-center">
            <div className="card p-3"><Truck className="w-5 h-5 mx-auto text-primary-600 mb-1" /><p className="text-[11px] font-semibold">Est. Delivery</p><p className="text-[10px] text-ink/40">{estimatedDelivery()}</p></div>
            <div className="card p-3"><ShieldCheck className="w-5 h-5 mx-auto text-primary-600 mb-1" /><p className="text-[11px] font-semibold">Quality Assured</p><p className="text-[10px] text-ink/40">Lab tested</p></div>
            <div className="card p-3"><RotateCcw className="w-5 h-5 mx-auto text-primary-600 mb-1" /><p className="text-[11px] font-semibold">Easy Returns</p><p className="text-[10px] text-ink/40">7-day policy</p></div>
          </div>
        </motion.div>
      </div>

      {/* Shipping & Returns - no tab/heading, this is the only remaining info block */}
      <div className="mt-14 grid sm:grid-cols-2 gap-5 text-sm">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2 font-bold"><PackageCheck className="w-4 h-4 text-primary-600" aria-hidden="true" /> Shipping Policy</div>
          <p className="text-ink/60 leading-relaxed">Orders are dispatched within 1-2 business days and delivered nationwide, typically within 3-7 business days depending on your location. Estimated delivery is shown at checkout.</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2 font-bold"><Undo2 className="w-4 h-4 text-primary-600" aria-hidden="true" /> Return Policy</div>
          <p className="text-ink/60 leading-relaxed">Unopened, unused packs can be returned within 7 days of delivery. See our <Link to="/terms" className="text-primary-600 font-semibold">Terms &amp; Conditions</Link> for full details.</p>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="section-title mb-6">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
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
          <p className="text-[11px] text-ink/40">{totalBags > 0 ? `${totalBags} bag${totalBags === 1 ? '' : 's'} selected` : 'No bags selected'}</p>
          <p className="font-extrabold text-primary-700 truncate">{formatUSD(estimatedSubtotal)}</p>
        </div>
        <button onClick={handleAddSelected} disabled={totalBags === 0} className="btn-primary flex-1 justify-center">
          <ShoppingCart className="w-4 h-4" aria-hidden="true" /> Add to Cart
        </button>
      </div>
    </div>
  )
}
