import { createContext, useContext } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'
import { useToast } from './ToastContext'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useLocalStorage('rb_wishlist', [])
  const { showToast } = useToast()

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((p) => p.id === product.id)
      if (exists) {
        showToast('Removed from wishlist', 'info')
        return prev.filter((p) => p.id !== product.id)
      }
      showToast('Added to wishlist', 'success')
      return [...prev, product]
    })
  }

  const isWishlisted = (id) => wishlist.some((p) => p.id === id)

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
