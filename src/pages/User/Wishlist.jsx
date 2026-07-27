import { Heart } from 'lucide-react'
import ProductCard from '../../components/product/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import Breadcrumb from '../../components/ui/Breadcrumb'
import { useWishlist } from '../../context/WishlistContext'

export default function Wishlist() {
  const { wishlist } = useWishlist()

  return (
    <div className="container-app py-8">
      <Breadcrumb items={[{ label: 'Wishlist' }]} />
      <h1 className="section-title mb-1">My Wishlist</h1>
      <p className="section-sub mb-6">{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>

      {wishlist.length === 0 ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" subtitle="Save products you love to buy them later." actionLabel="Explore Products" actionTo="/products" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {wishlist.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  )
}
