import { PackageSearch } from 'lucide-react'
import useHomeProducts from '../../hooks/useHomeProducts'
import ProductCard from '../../components/product/ProductCard'
import { ProductCardSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

// The Shop page shows exactly the same products as the Home page - both consume
// useHomeProducts(), so there is no separate filter/search/brand-selection
// mechanism here that could ever disagree with what Home displays.
export default function Products() {
  const { products, loading } = useHomeProducts()

  return (
    <div className="container-app py-8">
      <div className="mb-6">
        <h1 className="section-title">Shop Our Rice</h1>
        <p className="section-sub">
          {loading ? 'Loading...' : `${products.length} product${products.length === 1 ? '' : 's'} available`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon={PackageSearch} title="No products available right now." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  )
}
