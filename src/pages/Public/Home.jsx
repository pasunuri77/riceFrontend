import { motion } from 'framer-motion'
import { ShoppingBag, Package } from 'lucide-react'
import useHomeProducts from '../../hooks/useHomeProducts'
import ProductCard from '../../components/product/ProductCard'
import { ProductCardSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { safeImageUrl } from '../../utils/sanitize'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=900&h=900&fit=crop&q=80'

export default function Home() {
  const { products: sonaMasoori, loading } = useHomeProducts()
  const heroProduct = sonaMasoori[0]

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 via-cream to-leaf-50">
        <div className="container-app py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="badge bg-primary-100 text-primary-700 mb-4">🌾 100% Natural</span>
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink leading-tight">
              Premium <span className="text-primary-600">Sona Masoori</span> Rice
            </h1>
            <p className="text-ink/60 mt-4 text-base sm:text-lg max-w-lg">
              Naturally wholesome rice for everyday meals - light, aromatic, and grown for consistent quality in every batch.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <a href="#sona-masoori-products" className="btn-primary">
                <ShoppingBag className="w-4 h-4" aria-hidden="true" /> Shop Now
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="aspect-square rounded-full bg-gradient-to-br from-primary-200 to-leaf-200 p-8 max-w-md mx-auto">
              <img
                src={safeImageUrl(heroProduct?.image) || FALLBACK_IMAGE}
                alt="Sona Masoori Rice"
                className="w-full h-full object-cover rounded-full shadow-cardHover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sona Masoori Rice products */}
      <section id="sona-masoori-products" className="container-app py-14">
        <div className="mb-6">
          <h2 className="section-title">Sona Masoori Rice</h2>
          <p className="section-sub">Available Sona Masoori Rice products</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : sonaMasoori.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No Sona Masoori Rice products available right now."
            actionLabel="Browse Products"
            actionTo="/products"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {sonaMasoori.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </section>
    </div>
  )
}
