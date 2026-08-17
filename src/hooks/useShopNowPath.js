import useHomeProducts from './useHomeProducts'

// "Shop Now" / "Continue Shopping" normally land on the product grid - but
// when the catalogue only has one product, the grid is a pointless extra click
// before the only product you could possibly land on anyway. This skips
// straight to that product's page in that case, and returns to the real grid
// as soon as there's more than one. Built on useHomeProducts() (not a separate
// fetch) so "one product" always means the same thing here as it does on the
// Shop page itself.
export default function useShopNowPath() {
  const { products } = useHomeProducts()
  return products.length === 1 ? `/products/${products[0].id}` : '/products'
}
