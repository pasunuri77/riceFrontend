import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import Breadcrumb from '../../components/ui/Breadcrumb'
import EmptyState from '../../components/ui/EmptyState'
import { formatINR, estimatedDelivery } from '../../utils/format'
import { safeImageUrl } from '../../utils/sanitize'
import { useCart } from '../../context/CartContext'
import productApi from '../../api/productApi'

export default function Cart() {
  const { items, updateQty, removeFromCart, subtotal, deliveryCharge, total } = useCart()
  const [products, setProducts] = useState({})

  useEffect(() => {
    productApi.list()
      .then((list) => setProducts(Object.fromEntries(list.map((p) => [p.id, p]))))
      .catch(() => setProducts({}))
  }, [])

  // Same cap as the product page: can't hold more units in the cart than the current
  // stock allows for the selected pack size.
  const maxQtyFor = (item) => {
    const product = products[item.id]
    if (!product) return Infinity
    return Math.max(1, Math.floor(product.stock / item.weight))
  }

  return (
    <div className="container-app py-8">
      <Breadcrumb items={[{ label: 'Cart' }]} />
      <h1 className="section-title mb-6">Shopping Cart</h1>

      {items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Your cart is empty" subtitle="Looks like you haven't added any rice yet." actionLabel="Continue Shopping" actionTo="/products" />
      ) : (
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          <div className="space-y-3">
            {items.map((i) => {
              const maxQty = maxQtyFor(i)
              return (
                <div key={i.id + i.weight} className="card card-hover p-4 flex items-center gap-4">
                  <Link to={`/products/${i.id}`} className="shrink-0">
                    <img src={safeImageUrl(i.image)} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${i.id}`} className="text-sm font-semibold truncate block hover:text-primary-600">{i.name}</Link>
                    <p className="text-xs text-ink/40">{i.brand} • {i.weight} kg pack</p>
                    <p className="text-sm font-bold text-primary-700 mt-1">{formatINR(i.pricePerKg * i.weight)} <span className="text-xs text-ink/40 font-normal">/ unit</span></p>
                  </div>
                  <div className="flex items-center border border-black/10 rounded-lg">
                    <button
                      onClick={() => (i.qty <= 1 ? removeFromCart(i.id, i.weight) : updateQty(i.id, i.weight, i.qty - 1))}
                      aria-label={i.qty <= 1 ? `Remove ${i.name} from cart` : `Decrease quantity of ${i.name}`}
                      className="p-2 hover:bg-primary-50 transition-colors duration-150 rounded-l-lg"
                    >
                      <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{i.qty}</span>
                    <button
                      onClick={() => updateQty(i.id, i.weight, Math.min(maxQty, i.qty + 1))}
                      disabled={i.qty >= maxQty}
                      aria-label={`Increase quantity of ${i.name}`}
                      className="p-2 hover:bg-primary-50 transition-colors duration-150 rounded-r-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="font-bold w-20 text-right hidden sm:block">{formatINR(i.pricePerKg * i.weight * i.qty)}</p>
                  <button onClick={() => removeFromCart(i.id, i.weight)} aria-label={`Remove ${i.name} from cart`} className="text-ink/30 hover:text-red-500 hover:scale-110 transition-all duration-150"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                </div>
              )
            })}
            <Link to="/products" className="text-sm font-semibold text-primary-600 inline-block mt-2">← Continue Shopping</Link>
          </div>

          <div className="card p-5 h-fit sticky top-20">
            <h3 className="font-bold mb-4">Order Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-ink/50">Subtotal</span><span className="font-semibold">{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-ink/50">Delivery</span><span className="font-semibold">{deliveryCharge === 0 ? 'FREE' : formatINR(deliveryCharge)}</span></div>
              <div className="flex justify-between text-ink/50"><span>Estimated Delivery</span><span className="font-semibold text-ink">{estimatedDelivery()}</span></div>
            </div>
            <div className="border-t border-black/10 mt-4 pt-4 flex justify-between items-center">
              <span className="font-bold">Total</span>
              <span className="font-extrabold text-xl text-primary-700">{formatINR(total)}</span>
            </div>
            <Link to="/checkout" className="btn-primary w-full mt-5">Checkout <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      )}
    </div>
  )
}
