import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, Plus, CreditCard, Wallet, Landmark, Truck } from 'lucide-react'
import Breadcrumb from '../../components/ui/Breadcrumb'
import AddressCard from '../../components/forms/AddressCard'
import AddressForm from '../../components/forms/AddressForm'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { formatINR, estimatedDelivery } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import orderApi from '../../api/orderApi'
import { ShoppingCart as CartIcon } from 'lucide-react'

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Wallet },
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { id: 'netbanking', label: 'Net Banking', icon: Landmark },
  { id: 'cod', label: 'Cash on Delivery', icon: Truck },
]

export default function Checkout() {
  const { user, addresses, addAddress, setDefaultAddress } = useAuth()
  const { items, subtotal, deliveryCharge, total, clearCart } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [selected, setSelected] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [payment, setPayment] = useState('upi')
  const [placed, setPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    if (!selected && addresses.length > 0) {
      setSelected(addresses.find((a) => a.isDefault)?.id || addresses[0].id)
    }
  }, [addresses])

  if (items.length === 0 && !placed) {
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

  const placeOrder = () => {
    if (!selected) { showToast('Please select a delivery address', 'error'); return }
    const addr = addresses.find((a) => a.id === selected)
    const addressLine = addr ? [addr.flat, addr.area, addr.city].filter(Boolean).join(', ') : ''
    orderApi.create({
      customerId: user?.id,
      customerName: user?.name,
      address: addressLine,
      paymentMethod: payment,
      items,
      amount: total,
    }).then((order) => {
      setOrderId(order.id)
      setPlaced(true)
      clearCart()
    })
  }

  if (placed) {
    return (
      <div className="container-app py-16 max-w-lg text-center">
        <CheckCircle2 className="w-16 h-16 text-leaf-500 mx-auto mb-4" />
        <h1 className="section-title">Order Placed Successfully!</h1>
        <p className="text-ink/50 mt-2">Your order <span className="font-bold text-ink">{orderId}</span> has been confirmed. Estimated delivery by {estimatedDelivery()}.</p>
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

      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">1. Select Delivery Address</h3>
              <button onClick={() => setModalOpen(true)} className="btn-outline text-xs py-1.5 px-3"><Plus className="w-3.5 h-3.5" /> Add New</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {addresses.map((a) => (
                <AddressCard key={a.id} address={a} onSelect={(addr) => setSelected(addr.id)} selected={selected === a.id} onSetDefault={setDefaultAddress} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-3">2. Payment Method</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((pm) => (
                <label key={pm.id} className={`card p-4 flex items-center gap-3 cursor-pointer ${payment === pm.id ? 'ring-2 ring-primary-500' : ''}`}>
                  <input type="radio" checked={payment === pm.id} onChange={() => setPayment(pm.id)} className="accent-primary-500" />
                  <pm.icon className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-semibold">{pm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-3">3. Order Items ({items.length})</h3>
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
        </div>

        <div className="card p-5 h-fit sticky top-20">
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
          <button onClick={placeOrder} className="btn-primary w-full mt-5">Place Order</button>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Address" maxWidth="max-w-2xl">
        <AddressForm onSubmit={handleAddAddress} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
