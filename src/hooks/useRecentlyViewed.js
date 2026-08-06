import { useEffect, useState } from 'react'

const KEY = 'rb_recently_viewed'
const MAX_ITEMS = 8

function read() {
  try {
    const stored = localStorage.getItem(KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

// Purely a frontend/local-device feature - there's no backend endpoint for this,
// so it's scoped to localStorage rather than pretending to sync across devices.
export function trackRecentlyViewed(product) {
  if (!product?.id) return
  const list = read().filter((p) => p.id !== product.id)
  list.unshift({ id: product.id, name: product.name, brand: product.brand, image: product.image, pricePerKg: product.pricePerKg, mrp: product.mrp, rating: product.rating, reviews: product.reviews, stock: product.stock, badges: product.badges, weightOptions: product.weightOptions })
  write(list.slice(0, MAX_ITEMS))
}

export default function useRecentlyViewed(excludeId) {
  const [items, setItems] = useState([])

  useEffect(() => {
    setItems(read().filter((p) => p.id !== excludeId))
  }, [excludeId])

  return items
}
