import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, CreditCard, Smartphone, Landmark, Truck, Loader2, XCircle, RotateCcw, AlertTriangle, ShieldCheck, MapPin, Check } from 'lucide-react'
import AddressForm from '../../components/forms/AddressForm'
import Modal from '../../components/ui/Modal'
import DeliveryAddressModal from '../../components/checkout/DeliveryAddressModal'
import EmptyState from '../../components/ui/EmptyState'
import DeliveryTimeline from '../../components/ui/DeliveryTimeline'
import CouponInput from '../../components/cart/CouponInput'
import { formatUSD, estimatedDelivery } from '../../utils/format'
import { bagWeightLb } from '../../utils/stock'
import { findGreaterAustinAreaForZip } from '../../data/deliveryAreas'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import useShopNowPath from '../../hooks/useShopNowPath'
import { useToast } from '../../context/ToastContext'
import { useNotifications } from '../../context/NotificationContext'
import { ApiError } from '../../api/client'
import orderApi from '../../api/orderApi'
import productApi from '../../api/productApi'
import deliveryApi from '../../api/deliveryApi'
import { ShoppingCart as CartIcon } from 'lucide-react'

// Labels only reflect US payment methods now - `id` values are left unchanged
// (still 'upi'/'netbanking' internally) since they're sent to the backend as
// `paymentMethod` and may be relied on by admin-side order handling there.
const PAYMENT_METHODS = [
  { id: 'upi', label: 'Digital Wallet', icon: Smartphone },
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { id: 'netbanking', label: 'Bank Transfer', icon: Landmark },
  { id: 'cod', label: 'Cash on Delivery', icon: Truck },
]

export default function Checkout() {
  const { user, addresses, addAddress, updateAddress, deleteAddress } = useAuth()
  const { items, subtotal, deliveryCharge, tax, discountAmount, coupon, total, clearCart } = useCart()
  const { showToast } = useToast()
  const { notify } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const shopNowPath = useShopNowPath()

  const [selected, setSelected] = useState('')
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
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

  const selectedAddress = addresses.find((a) => a.id === selected)
  // Informational only - which Greater Austin area (named zone or sub-city)
  // this ZIP falls into, if any. Actual deliverability is still decided by
  // the real backend check further down in placeOrder(), not by this lookup.
  const selectedDeliveryArea = selectedAddress ? findGreaterAustinAreaForZip(selectedAddress.pincode) : null

  // Checkout places a real order tied to the logged-in account - an unauthenticated
  // visitor must never reach this page, since without a real session there's no
  // legitimate customer to attach the order to.
  if (!user) {
    return <Navigate to="/register" state={{ from: location }} replace />
  }

  if (items.length === 0 && stage !== 'placed') {
    return (
      <div className="container-app py-8">
        <EmptyState icon={CartIcon} title="Your cart is empty" subtitle="Add products to your cart before checking out." actionLabel="Browse Products" actionTo={shopNowPath} />
      </div>
    )
  }

  const openAddAddress = () => { setEditingAddress(null); setFormModalOpen(true) }
  const openEditAddress = (addr) => { setEditingAddress(addr); setFormModalOpen(true) }

  const handleAddressFormSubmit = async (data) => {
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, data)
        showToast('Address updated', 'success')
      } else {
        await addAddress(data)
        showToast('Address added', 'success')
      }
      setFormModalOpen(false)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to save address', 'error')
    }
  }

  const handleDeleteAddress = async (id) => {
    try {
      await deleteAddress(id)
      if (selected === id) setSelected('')
      showToast('Address removed', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to remove address', 'error')
    }
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

    // Re-check delivery at the moment of booking, even for an already-saved
    // address - it may have been saved before this check existed (e.g. via
    // Profile, which never validated it), or coverage may have changed since
    // it was saved.
    if (addr?.pincode) {
      // Cheap, definitive first pass: our own known Greater Austin ZIP list
      // (kept in lockstep with the backend's seeded serviceable_pincodes) - if
      // it's not on this list at all, there's no need to even call the API to
      // know the order shouldn't go through.
      if (!findGreaterAustinAreaForZip(addr.pincode)) {
        showToast(`Sorry, we don't currently deliver to ${addr.pincode}. Please choose a different address.`, 'error')
        return
      }

      // Checked per-product, not just the general pincode list, since a product
      // can be individually restricted (ProductDeliveryCoverage). A failed check
      // (network error, non-2xx) must NOT be treated as "deliverable" - that would
      // silently let an order through for an address the backend couldn't confirm,
      // which is worse than blocking checkout and asking the shopper to retry.
      try {
        const uniqueProductIds = [...new Set(items.map((i) => i.id))]
        const results = await Promise.all(
          uniqueProductIds.map((id) => deliveryApi.check(addr.pincode, id))
        )
        if (results.some((r) => !r.serviceable)) {
          showToast(`We don't currently deliver one or more items in your cart to ${addr.pincode}. Please choose a different address.`, 'error')
          return
        }
      } catch {
        showToast("We couldn't confirm delivery availability for this address right now. Please try again.", 'error')
        return
      }
    }

    // Full address, not just flat/area/city - this becomes a permanent snapshot
    // on the order (Order.addressSnapshot), so it needs to be complete at the
    // moment of booking; the address itself can be edited/deleted afterward.
    const addressLine = addr
      ? [addr.flat, addr.building, addr.street, addr.area, addr.landmark, addr.city, addr.district, addr.state, addr.pincode]
          .filter(Boolean).join(', ')
      : ''
    setStage('processing')
    orderApi.create({
      address: addressLine,
      paymentMethod: payment,
      items,
      couponCode: coupon?.code,
      notes,
    }).then((order) => {
      setOrderId(order.id)
      setStage('placed')
      clearCart()
      notify('ORDER_PLACED', { orderId: order.id })
      if (payment !== 'cod') notify('PAYMENT_SUCCESS', { orderId: order.id, amount: total })
    }).catch((err) => {
      if (payment === 'cod') {
        showToast(err instanceof ApiError ? err.message : 'Failed to place order. Please try again.', 'error')
        setStage('form')
      } else {
        // A non-COD method failing mid-flow reads as a payment failure, not just a
        // generic order error - give it its own recoverable screen with a retry.
        setStage('failed')
        notify('PAYMENT_FAILED', {})
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
          <Link to={shopNowPath} className="btn-outline">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-app py-8">
      {/* Step strip - reflects the real page flow (Cart -> Checkout -> Confirmation), not fabricated sub-steps */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wide">
          <span className="flex items-center gap-1.5 text-leaf-600"><Check className="w-3.5 h-3.5" /> Bag</span>
          <span className="w-6 sm:w-10 border-t border-dashed border-black/20" />
          <span className="text-primary-600">Checkout</span>
          <span className="w-6 sm:w-10 border-t border-dashed border-black/20" />
          <span className="text-ink/30">Confirmation</span>
        </div>
        <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-leaf-600 uppercase tracking-wide">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" /> 100% Secure
        </span>
      </div>

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
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-3">{items.length} Item{items.length === 1 ? '' : 's'} Selected</h3>
            <div className="card divide-y divide-black/5">
              {items.map((i) => (
                <div key={i.id + i.weight} className="p-3 flex items-center gap-3">
                  <Link to={`/products/${i.id}`} className="shrink-0">
                    <img src={i.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${i.id}`} className="text-sm font-semibold truncate block hover:text-primary-600">{i.name}</Link>
                    <p className="text-xs text-ink/40">{bagWeightLb(i.weight)}lb Bag • Qty: {i.qty} bag{i.qty === 1 ? '' : 's'}</p>
                  </div>
                  <p className="text-sm font-bold">{formatUSD(i.pricePerKg * i.weight * i.qty)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Deliver to bar */}
          {selectedAddress ? (
            <div className="card p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink/40">Deliver to</p>
                  <p className="text-sm font-semibold truncate">{selectedAddress.fullName}, {selectedAddress.pincode}</p>
                  <p className="text-xs text-ink/50 truncate">
                    {[selectedAddress.flat, selectedAddress.area, selectedAddress.city].filter(Boolean).join(', ')}
                  </p>
                  {selectedDeliveryArea ? (
                    <p className="text-xs text-leaf-600 font-semibold mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Delivery Area: {selectedDeliveryArea.areaName} - Available
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> Outside our known Greater Austin delivery areas - availability confirmed at checkout
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setAddressModalOpen(true)} className="btn-outline text-xs py-1.5 px-3 shrink-0">Change Address</button>
            </div>
          ) : (
            <div className="card p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-ink/30 shrink-0" aria-hidden="true" />
                <p className="text-sm text-ink/50">No delivery address selected</p>
              </div>
              <button onClick={() => setAddressModalOpen(true)} className="btn-primary text-xs py-1.5 px-3 shrink-0">Select Address</button>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-3">Payment Method</h3>
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
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-3">Order Notes <span className="normal-case font-normal text-ink/40">(Optional)</span></h3>
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
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-3">Coupons</h3>
            <CouponInput />
          </div>

          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-4">Price Details ({items.length} Item{items.length === 1 ? '' : 's'})</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-ink/50">Subtotal</span><span className="font-semibold">{formatUSD(subtotal)}</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-leaf-600"><span>Coupon ({coupon.code})</span><span className="font-semibold">-{formatUSD(discountAmount)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-ink/50">Delivery Charges</span><span className="font-semibold">{deliveryCharge === 0 ? 'FREE' : formatUSD(deliveryCharge)}</span></div>
              <div className="flex justify-between"><span className="text-ink/50">Tax</span><span className="font-semibold">{formatUSD(tax)}</span></div>
            </div>
            <div className="border-t border-black/10 mt-4 pt-4 flex justify-between items-center">
              <span className="font-bold">Total Amount</span>
              <span className="font-extrabold text-xl text-primary-700">{formatUSD(total)}</span>
            </div>
            <p className="text-[11px] text-ink/40 mt-1">Estimated delivery by {estimatedDelivery()}</p>
            <button onClick={placeOrder} className="btn-primary w-full mt-5">Place Order</button>
          </div>
        </div>
      </div>

      <DeliveryAddressModal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        addresses={addresses}
        selected={selected}
        onSelect={(id) => { setSelected(id); setAddressModalOpen(false) }}
        onEdit={(addr) => { setAddressModalOpen(false); openEditAddress(addr) }}
        onDelete={handleDeleteAddress}
        onAddNew={() => { setAddressModalOpen(false); openAddAddress() }}
      />

      <Modal open={formModalOpen} onClose={() => setFormModalOpen(false)} title={editingAddress ? 'Edit Address' : 'Add New Address'} maxWidth="max-w-2xl">
        <AddressForm initial={editingAddress} onSubmit={handleAddressFormSubmit} onCancel={() => setFormModalOpen(false)} submitLabel={editingAddress ? 'Update Address' : 'Save Address'} />
      </Modal>
    </div>
  )
}
