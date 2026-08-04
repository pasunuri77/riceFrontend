import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'
import { useToast } from './ToastContext'
import settingsApi from '../api/settingsApi'

const CartContext = createContext(null)

// Falls back to the old hardcoded values only until the real store settings load
// (or if that request fails), so the UI never shows a broken/blank delivery charge.
const DEFAULT_DELIVERY_SETTINGS = { deliveryCharge: 49, freeDeliveryThreshold: 999 }

export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage('rb_cart', [])
  const [deliverySettings, setDeliverySettings] = useState(DEFAULT_DELIVERY_SETTINGS)
  const { showToast } = useToast()

  useEffect(() => {
    settingsApi.getPublic()
      .then((s) => setDeliverySettings({
        deliveryCharge: Number(s?.deliveryCharge ?? DEFAULT_DELIVERY_SETTINGS.deliveryCharge),
        freeDeliveryThreshold: Number(s?.freeDeliveryThreshold ?? DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold),
      }))
      .catch(() => setDeliverySettings(DEFAULT_DELIVERY_SETTINGS))
  }, [])

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
  const deliveryCharge = subtotal === 0 || subtotal >= deliverySettings.freeDeliveryThreshold
    ? 0
    : deliverySettings.deliveryCharge
  const total = subtotal + deliveryCharge
  const count = items.reduce((n, i) => n + i.qty, 0)

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQty, clearCart, subtotal, deliveryCharge, total, count }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
