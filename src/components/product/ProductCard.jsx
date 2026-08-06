import { memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Scale } from 'lucide-react'
import RatingStars from './RatingStars'
import StockBadge, { OfferBadge } from './StockBadge'
import { formatINR } from '../../utils/format'
import ProductImage from './ProductImage'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useCompare } from '../../context/CompareContext'

function ProductCard({ product, index = 0 }) {
  const { addToCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { isComparing, toggleCompare } = useCompare()
  const wished = isWishlisted(product.id)
  const comparing = isComparing(product.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: (index % 8) * 0.04 }}
      className="card group relative flex flex-col overflow-hidden hover:shadow-cardHover transition-shadow duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-primary-50">
        <Link to={`/products/${product.id}`}>
          <ProductImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {product.badges?.map((b) => <OfferBadge key={b} label={b} />)}
        </div>
        <button
          onClick={() => toggleWishlist(product)}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={wished}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur bg-white/80 hover:bg-white transition ${wished ? 'text-red-500' : 'text-ink/50'}`}
        >
          <Heart className={`w-4 h-4 ${wished ? 'fill-red-500' : ''}`} aria-hidden="true" />
        </button>
        <button
          onClick={() => toggleCompare(product)}
          aria-label={comparing ? `Remove ${product.name} from comparison` : `Add ${product.name} to comparison`}
          aria-pressed={comparing}
          title="Add to compare"
          className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur bg-white/80 hover:bg-white transition opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 ${comparing ? 'text-primary-600 ring-2 ring-primary-400' : 'text-ink/50'}`}
        >
          <Scale className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="p-3.5 flex flex-col flex-1">
        <p className="text-[11px] font-bold text-primary-600 uppercase tracking-wide">{product.brand}</p>
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-sm text-ink leading-snug mt-0.5 line-clamp-2 hover:text-primary-600">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1.5"><RatingStars rating={product.rating} reviews={product.reviews} /></div>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-bold text-ink">{formatINR(product.pricePerKg)}<span className="text-xs text-ink/40 font-normal">/kg</span></span>
          {product.mrp > product.pricePerKg && (
            <span className="text-xs text-ink/35 line-through">{formatINR(product.mrp)}</span>
          )}
        </div>
        <div className="mt-1.5"><StockBadge stock={product.stock} /></div>

        <button
          onClick={() => addToCart(product)}
          disabled={product.stock <= 0}
          aria-label={`Add ${product.name} to cart`}
          className="btn-primary w-full mt-3 text-sm py-2"
        >
          <ShoppingCart className="w-4 h-4" aria-hidden="true" /> Add to Cart
        </button>
      </div>
    </motion.div>
  )
}

export default memo(ProductCard)
