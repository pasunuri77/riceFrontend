import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, UserPlus, Package, Plus, Minus, Trash2, CreditCard, Smartphone, Landmark, Truck, Store, CheckCircle2, Tag, X } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'
import AddressForm from '../../components/forms/AddressForm'
import { formatUSD } from '../../utils/format'
import { bagSizeLb, stockFieldForWeight } from '../../utils/stock'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import customerApi from '../../api/customerApi'
import productApi from '../../api/productApi'
import orderApi from '../../api/orderApi'
import settingsApi from '../../api/settingsApi'
import couponApi from '../../api/couponApi'

const PAYMENT_METHODS = [
  { id: 'upi', label: 'Digital Wallet', icon: Smartphone },
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { id: 'netbanking', label: 'Bank Transfer', icon: Landmark },
  { id: 'cod', label: 'Cash on Delivery', icon: Truck },
]

const ORDER_TYPES = [
  { id: 'online', label: 'Online Order', desc: 'Delivered to the customer - delivery charge + tax apply.', icon: Truck },
  { id: 'offline', label: 'Offline Order', desc: 'In-store / walk-in pickup - product cost + tax only, no delivery charge.', icon: Store },
]

const normalizeMoney = (value) => { const n = Number(value); return Number.isFinite(n) && n > 0 ? n : 0 }

export default function AdminNewOrder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()

  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [customerSearch, setCustomerSearch] = useState('')
  const [customer, setCustomer] = useState(null)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ fullName: '', email: '', mobile: '' })
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  const [orderType, setOrderType] = useState(searchParams.get('type') === 'offline' ? 'offline' : 'online')
  const [cartItems, setCartItems] = useState([])
  const [address, setAddress] = useState(null)
  const [payment, setPayment] = useState('cod')
  const [markAsPaid, setMarkAsPaid] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [storeSettings, setStoreSettings] = useState({ deliveryCharge: 0, freeDeliveryThreshold: 0, taxPercentage: 0 })
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  useEffect(() => {
    Promise.all([
      customerApi.list().then(setCustomers).catch(() => setCustomers([])),
      productApi.list().then(setProducts).catch(() => setProducts([])),
      settingsApi.getAdmin().then((s) => setStoreSettings({
        deliveryCharge: normalizeMoney(s?.deliveryCharge),
        freeDeliveryThreshold: normalizeMoney(s?.freeDeliveryThreshold),
        taxPercentage: normalizeMoney(s?.taxPercentage),
      })).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const matchingCustomers = useMemo(() => {
    if (!customerSearch.trim()) return []
    const q = customerSearch.toLowerCase()
    return customers.filter((c) => `${c.name} ${c.email} ${c.mobile}`.toLowerCase().includes(q)).slice(0, 6)
  }, [customers, customerSearch])

  const createNewCustomer = async () => {
    if (!newCustomer.fullName.trim() || !newCustomer.email.trim()) {
      showToast('Name and email are required', 'error')
      return
    }
    if (newCustomer.mobile.length !== 10) {
      showToast('Enter a valid 10-digit mobile number', 'error')
      return
    }
    setCreatingCustomer(true)
    try {
      const created = await customerApi.create(newCustomer)
      setCustomers((prev) => [...prev, created])
      setCustomer(created)
      setShowNewCustomer(false)
      setNewCustomer({ fullName: '', email: '', mobile: '' })
      showToast(`Customer added - setup link emailed to ${created.email}`, 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to add customer', 'error')
    } finally {
      setCreatingCustomer(false)
    }
  }

  const addItem = (product, weight) => {
    const stock = product[stockFieldForWeight(product.weightOptions, weight)] ?? 0
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.weight === weight)
      if (existing) {
        if (existing.qty >= stock) { showToast('No more stock available for this bag size', 'error'); return prev }
        return prev.map((i) => (i === existing ? { ...i, qty: i.qty + 1 } : i))
      }
      if (stock < 1) { showToast('Out of stock for this bag size', 'error'); return prev }
      return [...prev, { id: product.id, name: product.name, image: product.image, pricePerKg: product.pricePerKg, weight, qty: 1 }]
    })
  }

  const changeQty = (id, weight, delta) => {
    setCartItems((prev) => prev
      .map((i) => (i.id === id && i.weight === weight ? { ...i, qty: i.qty + delta } : i))
      .filter((i) => i.qty > 0))
  }

  const removeItem = (id, weight) => setCartItems((prev) => prev.filter((i) => !(i.id === id && i.weight === weight)))

  const subtotal = useMemo(() => cartItems.reduce((sum, i) => sum + i.pricePerKg * i.weight * i.qty, 0), [cartItems])

  // Offline (in-store/walk-in) orders never carry a delivery charge - only
  // online orders do, and only when the subtotal is below the free-delivery
  // threshold (mirrors the customer-facing CartContext calculation exactly).
  const deliveryCharge = useMemo(() => {
    if (orderType === 'offline' || subtotal === 0) return 0
    if (storeSettings.freeDeliveryThreshold > 0 && subtotal >= storeSettings.freeDeliveryThreshold) return 0
    return storeSettings.deliveryCharge
  }, [orderType, subtotal, storeSettings])

  const tax = useMemo(() => (subtotal === 0 ? 0 : Math.round((subtotal * storeSettings.taxPercentage / 100) * 100) / 100), [subtotal, storeSettings.taxPercentage])

  const discountAmount = coupon?.discountAmount || 0
  const total = Math.max(0, subtotal - discountAmount + deliveryCharge + tax)

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setApplyingCoupon(true)
    try {
      const result = await couponApi.validate(couponCode, subtotal)
      if (!result.valid) { showToast(result.message || 'This coupon is not valid', 'error'); return }
      setCoupon({ code: couponCode.trim().toUpperCase(), discountAmount: normalizeMoney(result.discountAmount) })
      setCouponCode('')
      showToast('Coupon applied', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to validate coupon right now', 'error')
    } finally {
      setApplyingCoupon(false)
    }
  }
  const removeCoupon = () => setCoupon(null)

  const handleAddressSubmit = (data) => {
    const { addressLine1: street, addressLine2: flat, city, zip: pincode, ...rest } = data
    setAddress({ ...rest, flat, street, area: city, city, pincode })
    showToast('Delivery address saved', 'success')
  }

  const needsAddress = orderType === 'online'
  const canSubmit = customer && cartItems.length > 0 && (!needsAddress || address)

  const submitOrder = async () => {
    if (!customer) { showToast('Select or add a customer first', 'error'); return }
    if (cartItems.length === 0) { showToast('Add at least one item to the order', 'error'); return }
    if (needsAddress && !address) { showToast('Add a delivery address for this order', 'error'); return }

    const addressLine = needsAddress && address
      ? [address.flat, address.street, address.area, address.city, address.state, address.pincode].filter(Boolean).join(', ')
      : ''

    setSubmitting(true)
    try {
      const order = await orderApi.createForCustomer({
        customerId: customer.id,
        orderType,
        address: addressLine,
        paymentMethod: payment,
        items: cartItems,
        notes,
        markAsPaid,
        couponCode: coupon?.code,
      })
      showToast(`Order ${order.id} created for ${customer.name}`, 'success')
      navigate('/admin/orders')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to create order', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Orders', to: '/admin/orders' }, { label: 'New Order' }]} />
      <PageHeader title="Book Order on Behalf of Customer" subtitle="Create an order for an existing customer, or add a new one on the spot." />

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-5">
          {/* Step 1: Customer */}
          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-3">1. Customer</h3>
            {customer ? (
              <div className="flex items-center justify-between gap-3 bg-primary-50 rounded-xl p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold shrink-0">{customer.name?.[0]}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{customer.name}</p>
                    <p className="text-xs text-ink/50 truncate">{customer.email}</p>
                  </div>
                </div>
                <button onClick={() => setCustomer(null)} className="text-xs font-semibold text-primary-700 hover:underline shrink-0">Change</button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" aria-hidden="true" />
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name, email, or mobile..."
                    className="input-field pl-10"
                  />
                </div>
                {matchingCustomers.length > 0 && (
                  <div className="mt-2 border border-black/10 rounded-xl divide-y divide-black/5 overflow-hidden">
                    {matchingCustomers.map((c) => (
                      <button key={c.id} onClick={() => { setCustomer(c); setCustomerSearch('') }} className="w-full flex items-center gap-2.5 p-2.5 hover:bg-primary-50 text-left">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">{c.name?.[0]}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{c.name}</p>
                          <p className="text-xs text-ink/40 truncate">{c.email} • {c.mobile}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!showNewCustomer ? (
                  <button onClick={() => setShowNewCustomer(true)} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700">
                    <UserPlus className="w-3.5 h-3.5" /> Add New Customer (not registered yet)
                  </button>
                ) : (
                  <div className="mt-3 bg-primary-50/60 border border-primary-100 rounded-xl p-4 space-y-2.5">
                    <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider">New Customer</p>
                    <input value={newCustomer.fullName} onChange={(e) => setNewCustomer((c) => ({ ...c, fullName: e.target.value }))} placeholder="Full name" className="input-field" />
                    <input value={newCustomer.email} onChange={(e) => setNewCustomer((c) => ({ ...c, email: e.target.value }))} type="email" placeholder="Email" className="input-field" />
                    <input
                      value={newCustomer.mobile}
                      onChange={(e) => setNewCustomer((c) => ({ ...c, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Mobile number"
                      className="input-field"
                    />
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setShowNewCustomer(false)} className="btn-ghost border border-black/10 text-xs px-3 py-1.5">Cancel</button>
                      <button onClick={createNewCustomer} disabled={creatingCustomer} className="btn-primary text-xs px-3 py-1.5 disabled:opacity-60">
                        {creatingCustomer ? 'Adding...' : 'Add & Select'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {customer && (
            <>
              {/* Step 2: Order Type */}
              <div className="card p-5">
                <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-3">2. Order Type</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {ORDER_TYPES.map((t) => (
                    <label key={t.id} className={`card p-3.5 flex items-start gap-2.5 cursor-pointer ${orderType === t.id ? 'ring-2 ring-primary-500' : ''}`}>
                      <input type="radio" checked={orderType === t.id} onChange={() => { setOrderType(t.id); if (t.id === 'offline') setAddress(null) }} className="accent-primary-500 mt-0.5" />
                      <t.icon className="w-4.5 h-4.5 text-primary-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{t.label}</p>
                        <p className="text-xs text-ink/50 mt-0.5">{t.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 3: Items */}
              <div className="card p-5">
                <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-3">3. Items</h3>
                {loading ? (
                  <p className="text-sm text-ink/40">Loading products...</p>
                ) : (
                  <div className="space-y-3">
                    {products.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 border-b border-black/5 last:border-0 pb-3 last:pb-0">
                        <img src={p.image} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{p.name}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {p.weightOptions.map((w) => {
                              const stock = p[stockFieldForWeight(p.weightOptions, w)] ?? 0
                              return (
                                <button
                                  key={w}
                                  onClick={() => addItem(p, w)}
                                  disabled={stock < 1}
                                  className="text-xs font-semibold px-2.5 py-1 rounded-full border border-primary-200 text-primary-700 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  + {bagSizeLb(p.weightOptions, w)}lb ({formatUSD(p.pricePerKg * w)})
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    {products.length === 0 && <p className="text-sm text-ink/40 flex items-center gap-2"><Package className="w-4 h-4" /> No products available.</p>}
                  </div>
                )}

                {cartItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-black/10 space-y-2">
                    {cartItems.map((i) => (
                      <div key={i.id + i.weight} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{i.name}</p>
                          <p className="text-xs text-ink/40">{bagSizeLb(products.find((p) => p.id === i.id)?.weightOptions, i.weight)}lb Bag</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => changeQty(i.id, i.weight, -1)} className="p-1 rounded-lg hover:bg-black/5"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="w-5 text-center font-semibold">{i.qty}</span>
                          <button onClick={() => changeQty(i.id, i.weight, 1)} className="p-1 rounded-lg hover:bg-black/5"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                        <p className="font-bold w-16 text-right shrink-0">{formatUSD(i.pricePerKg * i.weight * i.qty)}</p>
                        <button onClick={() => removeItem(i.id, i.weight)} className="p-1 rounded-lg hover:bg-red-50 text-red-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 4: Delivery Address (online orders only) */}
              {needsAddress && (
                <div className="card p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-3">4. Delivery Address</h3>
                  {address ? (
                    <div className="flex items-start justify-between gap-3 bg-primary-50 rounded-xl p-3">
                      <div className="text-sm min-w-0">
                        <p className="font-semibold">{address.fullName}</p>
                        <p className="text-ink/60 truncate">{[address.flat, address.street, address.area, address.city, address.state, address.pincode].filter(Boolean).join(', ')}</p>
                      </div>
                      <button onClick={() => setAddress(null)} className="text-xs font-semibold text-primary-700 hover:underline shrink-0">Edit</button>
                    </div>
                  ) : (
                    <AddressForm onSubmit={handleAddressSubmit} submitLabel="Save Address" />
                  )}
                </div>
              )}

              {/* Step 5: Payment */}
              <div className="card p-5">
                <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-3">{needsAddress ? '5' : '4'}. Payment</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((pm) => (
                    <label key={pm.id} className={`card p-3.5 flex items-center gap-2.5 cursor-pointer ${payment === pm.id ? 'ring-2 ring-primary-500' : ''}`}>
                      <input type="radio" checked={payment === pm.id} onChange={() => setPayment(pm.id)} className="accent-primary-500" />
                      <pm.icon className="w-4.5 h-4.5 text-primary-600" />
                      <span className="text-sm font-semibold">{pm.label}</span>
                    </label>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold mt-3 cursor-pointer">
                  <input type="checkbox" checked={markAsPaid} onChange={(e) => setMarkAsPaid(e.target.checked)} className="accent-primary-500 w-4 h-4" />
                  Mark as already paid (cash/card collected at desk)
                </label>

                <FormField label="Order Notes (Optional)">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="E.g. Called in order, deliver after 5pm..." className="input-field mt-3" />
                </FormField>
              </div>
            </>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4 h-fit sticky top-20">
          {cartItems.length > 0 && (
            <div className="card p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-3">Coupon</h3>
              {coupon ? (
                <div className="flex items-center justify-between gap-2 bg-leaf-50 border border-leaf-200 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag className="w-4 h-4 text-leaf-600 shrink-0" aria-hidden="true" />
                    <span className="text-sm font-semibold text-leaf-700 truncate">{coupon.code}</span>
                    <span className="text-xs text-leaf-600 shrink-0">-{formatUSD(discountAmount)}</span>
                  </div>
                  <button type="button" onClick={removeCoupon} aria-label="Remove coupon" className="text-leaf-600 hover:text-leaf-800 shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" aria-hidden="true" />
                    <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="input-field pl-9 text-sm" />
                  </div>
                  <button type="button" onClick={applyCoupon} disabled={applyingCoupon || !couponCode.trim()} className="btn-outline text-sm px-4 disabled:opacity-50">
                    {applyingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink/50 mb-3">Order Summary</h3>
            {cartItems.length === 0 ? (
              <p className="text-sm text-ink/40">No items added yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {cartItems.map((i) => (
                  <div key={i.id + i.weight} className="flex justify-between">
                    <span className="text-ink/60 truncate pr-2">{i.name} x{i.qty}</span>
                    <span className="font-semibold shrink-0">{formatUSD(i.pricePerKg * i.weight * i.qty)}</span>
                  </div>
                ))}
              </div>
            )}

            {cartItems.length > 0 && (
              <div className="border-t border-black/10 mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink/50">Subtotal</span><span className="font-semibold">{formatUSD(subtotal)}</span></div>
                {orderType === 'online' && (
                  <div className="flex justify-between"><span className="text-ink/50">Delivery Charge</span><span className="font-semibold">{deliveryCharge === 0 ? 'FREE' : formatUSD(deliveryCharge)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-ink/50">Tax</span><span className="font-semibold">{formatUSD(tax)}</span></div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-leaf-600"><span>Coupon ({coupon.code})</span><span className="font-semibold">-{formatUSD(discountAmount)}</span></div>
                )}
              </div>
            )}

            <div className="border-t border-black/10 mt-4 pt-4 flex justify-between items-center">
              <span className="font-bold">Total</span>
              <span className="font-extrabold text-lg text-primary-700">{formatUSD(total)}</span>
            </div>
            <SubmitButton onClick={submitOrder} loading={submitting} disabled={!canSubmit} className="btn-primary w-full mt-5">
              <CheckCircle2 className="w-4 h-4" /> Create Order
            </SubmitButton>
            {!canSubmit && (
              <p className="text-[11px] text-ink/40 mt-2">
                {needsAddress ? 'Select a customer, add items, and set a delivery address to continue.' : 'Select a customer and add items to continue.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
