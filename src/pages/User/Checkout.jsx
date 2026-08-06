import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Plus, CreditCard, Smartphone, Landmark, Truck, Loader2, XCircle, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react'
import Breadcrumb from '../../components/ui/Breadcrumb'
import AddressCard from '../../components/forms/AddressCard'
import AddressForm from '../../components/forms/AddressForm'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import DeliveryTimeline from '../../components/ui/DeliveryTimeline'
import CouponInput from '../../components/cart/CouponInput'
import { formatINR, estimatedDelivery } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import orderApi from '../../api/orderApi'
import productApi from '../../api/productApi'
import { ShoppingCart as CartIcon } from 'lucide-react'

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { id: 'netbanking', label: 'Net Banking', icon: Landmark },
  { id: 'cod', label: 'Cash on Delivery', icon: Truck },
]

export default function Checkout() {
  const { user, addresses, addAddress, setDefaultAddress } = useAuth()
  const { items, subtotal, deliveryCharge, total, clearCart } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [selected, setSelected] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [payment, setPayment] = useState('upi')
  const [notes, setNotes] = useState('')
  const [stage, setStage] = useState('form') // 'form' | 'processing' | 'failed' | 'placed'
  const [orderId, setOrderId] = useState('')
  const [stockWarning, setStockWarning] = useState('')

  useEffect(() => {
    if (!selected && addresses.length > 0) {
      setSelected(addresses.find((a) => a.isDefault)?.id || addresses[0].id)
    }
  }, [addresses])

  // Checkout places a real order tied to the logged-in account - an unauthenticated
  // visitor must never reach this page, since without a real session there's no
  // legitimate customer to attach the order to.
  if (!user) {
    return <Navigate to="/register" state={{ from: location }} replace />
  }

  if (items.length === 0 && stage !== 'placed') {
    return (
      <div className="container-app py-8">
        <EmptyState icon={CartIcon} title="Your cart is empty" subtitle="Add products to your cart before checking out." actionLabel="Browse Products" actionTo="/products" />
      </div>
    )
  }

  const handleAddAddress = (data) => {
    addAddress(data)
    setModalOpen(false)
    showToast('Address added', 'success')
  }

  const placeOrder = async () => {
    if (!selected) { showToast('Please select a delivery address', 'error'); return }

    // Soft client-side stock check before submitting - the backend doesn't atomically
    // validate/reserve stock at order time yet, so this catches the common case
    // (someone else bought the last units while you were on checkout) rather than
    // letting an order silently go through against a quantity that's no longer available.
    setStockWarning('')
    try {
      const liveProducts = await productApi.list()
      const byId = Object.fromEntries(liveProducts.map((p) => [p.id, p]))
      const short = items.find((i) => {
        const live = byId[i.id]
        return live && live.stock < i.weight * i.qty
      })
      if (short) {
        setStockWarning(`"${short.name}" no longer has enough stock for the quantity in your cart. Please update your cart and try again.`)
        return
      }
    } catch {
      // If the stock check itself fails (network), fall through and let the real
      // order request be the source of truth rather than blocking checkout entirely.
    }

    const addr = addresses.find((a) => a.id === selected)
    const addressLine = addr ? [addr.flat, addr.area, addr.city].filter(Boolean).join(', ') : ''
    setStage('processing')
    orderApi.create({
      address: addressLine,
      paymentMethod: payment,
      items,
    }).then((order) => {
      setOrderId(order.id)
      setStage('placed')
      clearCart()
    }).catch((err) => {
      if (payment === 'cod') {
        showToast(err instanceof ApiError ? err.message : 'Failed to place order. Please try again.', 'error')
        setStage('form')
      } else {
        // A non-COD method failing mid-flow reads as a payment failure, not just a
        // generic order error - give it its own recoverable screen with a retry.
        setStage('failed')
      }
    })
  }

  if (stage === 'processing') {
    return (
      <div className="container-app py-24 max-w-sm text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-14 h-14 mx-auto mb-5">
          <Loader2 className="w-14 h-14 text-primary-500" aria-hidden="true" />
        </motion.div>
        <h1 className="font-bold text-lg">{payment === 'cod' ? 'Placing your order...' : 'Processing payment...'}</h1>
        <p className="text-sm text-ink/50 mt-1">Please don't close this page.</p>
      </div>
    )
  }

  if (stage === 'failed') {
    return (
      <div className="container-app py-20 max-w-sm text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
          <h1 className="font-bold text-lg">Payment Failed</h1>
          <p className="text-sm text-ink/50 mt-2">We couldn't process your payment. No amount has been charged. Please try again or choose a different payment method.</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={placeOrder} className="btn-primary"><RotateCcw className="w-4 h-4" aria-hidden="true" /> Retry Payment</button>
            <button onClick={() => setStage('form')} className="btn-outline">Change Method</button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (stage === 'placed') {
    return (
      <div className="container-app py-16 max-w-lg text-center">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.5 }}>
          <CheckCircle2 className="w-16 h-16 text-leaf-500 mx-auto mb-4" />
        </motion.div>
        <h1 className="section-title">Order Placed Successfully!</h1>
        <p className="text-ink/50 mt-2">Your order <span className="font-bold text-ink">{orderId}</span> has been confirmed. Estimated delivery by {estimatedDelivery()}.</p>
        <div className="card p-5 mt-8 text-left">
          <DeliveryTimeline currentIndex={0} />
        </div>
        <div className="flex gap-3 justify-center mt-6">
          <Link to="/dashboard/orders" className="btn-primary">View Orders</Link>
          <Link to="/products" className="btn-outline">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-app py-8">
      <Breadcrumb items={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="section-title mb-6">Checkout</h1>

      <AnimatePresence>
        {stockWarning && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <p>{stockWarning}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                Select Delivery Address
              </h3>
              <button onClick={() => setModalOpen(true)} className="btn-outline text-xs py-1.5 px-3"><Plus className="w-3.5 h-3.5" /> Add New</button>
            </div>
            {addresses.length === 0 ? (
              <div className="card p-6 text-center text-sm text-ink/50">No saved addresses yet. Add one to continue.</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {addresses.map((a) => (
                  <AddressCard key={a.id} address={a} onSelect={(addr) => setSelected(addr.id)} selected={selected === a.id} onSetDefault={setDefaultAddress} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              Payment Method
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((pm) => (
                <label key={pm.id} className={`card p-4 flex items-center gap-3 cursor-pointer ${payment === pm.id ? 'ring-2 ring-primary-500' : ''}`}>
                  <input type="radio" checked={payment === pm.id} onChange={() => setPayment(pm.id)} className="accent-primary-500" />
                  <pm.icon className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-semibold">{pm.label}</span>
                </label>
              ))}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-ink/40 mt-2"><ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Payments are encrypted and secure.</p>
          </div>

          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
              Order Items ({items.length})
            </h3>
            <div className="card divide-y divide-black/5">
              {items.map((i) => (
                <div key={i.id + i.weight} className="p-3 flex items-center gap-3">
                  <img src={i.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{i.name}</p>
                    <p className="text-xs text-ink/40">{i.weight}kg × {i.qty}</p>
                  </div>
                  <p className="text-sm font-bold">{formatINR(i.pricePerKg * i.weight * i.qty)}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
              Order Notes <span className="text-xs font-normal text-ink/40">(Optional)</span>
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="E.g. Leave at the door, call before delivery..."
              className="input-field"
            />
          </div>
        </div>

        <div className="space-y-4 h-fit sticky top-20">
          <div className="card p-5">
            <h3 className="font-bold mb-3 text-sm">Have a Coupon?</h3>
            <CouponInput />
          </div>

          <div className="card p-5">
            <h3 className="font-bold mb-4">Price Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-ink/50">Subtotal</span><span className="font-semibold">{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-ink/50">Delivery</span><span className="font-semibold">{deliveryCharge === 0 ? 'FREE' : formatINR(deliveryCharge)}</span></div>
              <div className="flex justify-between"><span className="text-ink/50">Estimated Delivery</span><span className="font-semibold">{estimatedDelivery()}</span></div>
            </div>
            <div className="border-t border-black/10 mt-4 pt-4 flex justify-between items-center">
              <span className="font-bold">Total</span>
              <span className="font-extrabold text-xl text-primary-700">{formatINR(total)}</span>
            </div>
            <p className="text-[11px] text-ink/35 mt-1">Inclusive of all applicable taxes.</p>
            <button onClick={placeOrder} className="btn-primary w-full mt-5">Place Order</button>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Address" maxWidth="max-w-2xl">
        <AddressForm onSubmit={handleAddAddress} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
