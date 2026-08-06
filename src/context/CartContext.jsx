import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import useLocalStorage from '../hooks/useLocalStorage'
import { useToast } from './ToastContext'
import settingsApi from '../api/settingsApi'

const CartContext = createContext(null)
const defaultDeliverySettings = {
  deliveryCharge: 0,
  freeDeliveryThreshold: 0,
}

function normalizeMoney(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage('rb_cart', [])
  const [deliverySettings, setDeliverySettings] = useState(defaultDeliverySettings)
  const { showToast } = useToast()
  const { pathname } = useLocation()

  const refreshDeliverySettings = useCallback(() => {
    return settingsApi.get()
      .then((settings) => {
        setDeliverySettings({
          deliveryCharge: normalizeMoney(settings?.deliveryCharge),
          freeDeliveryThreshold: normalizeMoney(settings?.freeDeliveryThreshold),
        })
      })
      .catch(() => {
        setDeliverySettings(defaultDeliverySettings)
      })
  }, [])

  useEffect(() => {
    refreshDeliverySettings()
  }, [refreshDeliverySettings])

  useEffect(() => {
    if (pathname === '/cart' || pathname === '/checkout' || pathname === '/dashboard/cart') {
      refreshDeliverySettings()
    }
  }, [pathname, refreshDeliverySettings])

  useEffect(() => {
    window.addEventListener('store-settings:saved', refreshDeliverySettings)
    return () => window.removeEventListener('store-settings:saved', refreshDeliverySettings)
  }, [refreshDeliverySettings])

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

  const clearCart = () => setItems([])

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.pricePerKg * i.weight * i.qty, 0),
    [items]
  )
  const deliveryCharge = useMemo(() => {
    if (subtotal === 0) return 0
    const threshold = deliverySettings.freeDeliveryThreshold
    if (threshold > 0 && subtotal >= threshold) return 0
    return deliverySettings.deliveryCharge
  }, [deliverySettings, subtotal])
  const total = subtotal + deliveryCharge
  // Number of distinct items in the cart, not the sum of their quantities/pack weights.
  const count = items.length

  return (
    <CartContext.Provider
      value={{
        items, addToCart, removeFromCart, updateQty, clearCart, subtotal, deliveryCharge, total, count,
        freeDeliveryThreshold: deliverySettings.freeDeliveryThreshold,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
