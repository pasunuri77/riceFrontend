import { useEffect, useState } from 'react'
import productApi from '../api/productApi'

// Single source of truth for which products the storefront currently sells.
// The Home page hero/grid and the Shop page must both render this exact same
// list - never a separately computed selection - so the two pages can never
// drift apart. Filtered against the real `brand` field the backend returns
// (confirmed via GET /api/products: "Sona Masoori Co."), not hardcoded IDs.
export const FEATURED_BRAND = 'Sona Masoori Co.'

export default function useHomeProducts() {
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productApi.list().then(setAllProducts).catch(() => setAllProducts([])).finally(() => setLoading(false))
  }, [])

  const products = allProducts.filter((p) => p.brand === FEATURED_BRAND)

  return { products, loading }
}
