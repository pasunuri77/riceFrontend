import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import useLocalStorage from '../hooks/useLocalStorage'
import { useToast } from './ToastContext'
import settingsApi from '../api/settingsApi'
import couponApi from '../api/couponApi'
import { ApiError } from '../api/client'

const CartContext = createContext(null)
const defaultStoreSettings = {
  deliveryCharge: 0,
  freeDeliveryThreshold: 0,
  taxPercentage: 0,
}

function normalizeMoney(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage('rb_cart', [])
  const [storeSettings, setStoreSettings] = useState(defaultStoreSettings)
  const [coupon, setCoupon] = useState(null) // { code, discountAmount }
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const { showToast } = useToast()
  const { pathname } = useLocation()

  const refreshStoreSettings = useCallback(() => {
    return settingsApi.get()
      .then((settings) => {
        setStoreSettings({
          deliveryCharge: normalizeMoney(settings?.deliveryCharge),
          freeDeliveryThreshold: normalizeMoney(settings?.freeDeliveryThreshold),
          taxPercentage: normalizeMoney(settings?.taxPercentage),
        })
      })
      .catch(() => {
        setStoreSettings(defaultStoreSettings)
      })
  }, [])

  useEffect(() => {
    refreshStoreSettings()
  }, [refreshStoreSettings])

  useEffect(() => {
    if (pathname === '/cart' || pathname === '/checkout' || pathname === '/dashboard/cart') {
      refreshStoreSettings()
    }
  }, [pathname, refreshStoreSettings])

  useEffect(() => {
    window.addEventListener('store-settings:saved', refreshStoreSettings)
    return () => window.removeEventListener('store-settings:saved', refreshStoreSettings)
  }, [refreshStoreSettings])

  const addToCart = (product, weight = product.weightOptions[0], qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.weight === weight)
      if (existing) {
        return prev.map((i) =>
          i.id === product.id && i.weight === weight ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          brand: product.brand,
          image: product.image,
          pricePerKg: product.pricePerKg,
          weight,
          qty,
        },
      ]
    })
    showToast(`${product.name} added to cart`, 'success')
  }

  const removeFromCart = (id, weight) =>
    setItems((prev) => prev.filter((i) => !(i.id === id && i.weight === weight)))

  const updateQty = (id, weight, qty) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id && i.weight === weight ? { ...i, qty: Math.max(1, qty) } : i))
    )

  const clearCart = () => {
    setItems([])
    setCoupon(null)
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.pricePerKg * i.weight * i.qty, 0),
    [items]
  )

  const deliveryCharge = useMemo(() => {
    if (subtotal === 0) return 0
    const threshold = storeSettings.freeDeliveryThreshold
    if (threshold > 0 && subtotal >= threshold) return 0
    return storeSettings.deliveryCharge
  }, [storeSettings, subtotal])

  const tax = useMemo(() => {
    if (subtotal === 0) return 0
    return Math.round((subtotal * storeSettings.taxPercentage / 100) * 100) / 100
  }, [subtotal, storeSettings.taxPercentage])

  const discountAmount = coupon?.discountAmount || 0
  const total = Math.max(0, subtotal - discountAmount + deliveryCharge + tax)

  const applyCoupon = async (code) => {
    setApplyingCoupon(true)
    try {
      const result = await couponApi.validate(code, subtotal)
      if (!result.valid) {
        showToast(result.message || 'This coupon is not valid', 'error')
        return false
      }
      setCoupon({ code: code.trim().toUpperCase(), discountAmount: normalizeMoney(result.discountAmount) })
      showToast(`Coupon applied! You saved ${normalizeMoney(result.discountAmount) ? `₹${result.discountAmount}` : ''}`.trim(), 'success')
      return true
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Unable to validate coupon right now', 'error')
      return false
    } finally {
      setApplyingCoupon(false)
    }
  }

  const removeCoupon = () => setCoupon(null)

  // Keep the applied discount honest as the cart itself changes (e.g. a min-order
  // coupon can stop qualifying once items are removed) - silently re-validate
  // rather than letting a stale discount ride to checkout.
  useEffect(() => {
    if (!coupon) return
    couponApi.validate(coupon.code, subtotal)
      .then((result) => {
        if (!result.valid) {
          setCoupon(null)
          showToast(`Coupon "${coupon.code}" no longer applies: ${result.message || 'requirements not met'}`, 'info')
        } else {
          setCoupon((c) => (c ? { ...c, discountAmount: normalizeMoney(result.discountAmount) } : c))
        }
      })
      .catch(() => { /* leave last-known discount rather than clearing on a network blip */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal])

  // Number of distinct items in the cart, not the sum of their quantities/pack weights.
  const count = items.length

  return (
    <CartContext.Provider
      value={{
        items, addToCart, removeFromCart, updateQty, clearCart,
        subtotal, deliveryCharge, tax, total, count,
        freeDeliveryThreshold: storeSettings.freeDeliveryThreshold,
        taxPercentage: storeSettings.taxPercentage,
        coupon, discountAmount, applyCoupon, removeCoupon, applyingCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
