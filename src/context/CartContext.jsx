import { createContext, useContext, useMemo } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'
import { useToast } from './ToastContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage('rb_cart', [])
  const { showToast } = useToast()

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
  const deliveryCharge = subtotal > 999 || subtotal === 0 ? 0 : 49
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
