import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, PackageSearch } from 'lucide-react'
import productApi from '../../api/productApi'
import brandApi from '../../api/brandApi'
import categoryApi from '../../api/categoryApi'
import ProductCard from '../../components/product/ProductCard'
import { ProductCardSkeleton } from '../../components/ui/Skeleton'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import Breadcrumb from '../../components/ui/Breadcrumb'

const PAGE_SIZE = 12

export default function Products() {
  const [params, setParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)

  const [productsData, setProductsData] = useState([])
  const [brandsData, setBrandsData] = useState([])
  const [categoriesData, setCategoriesData] = useState([])

  const [search, setSearch] = useState(params.get('search') || '')
  const [brand, setBrand] = useState(params.get('brand') || '')
  const [category, setCategory] = useState(params.get('category') || '')
  const [type, setType] = useState('')
  const [origin, setOrigin] = useState('')
  const [maxPrice, setMaxPrice] = useState(250)
  const [minRating, setMinRating] = useState(0)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    setLoading(true)
    Promise.all([productApi.list(), brandApi.list(), categoryApi.list()]).then(([products, brands, categories]) => {
      setProductsData(products)
      setBrandsData(brands)
      setCategoriesData(categories)
      setLoading(false)
    })
  }, [])

  useEffect(() => setPage(1), [search, brand, category, type, origin, maxPrice, minRating, inStockOnly, sort])

  const TYPES = useMemo(() => [...new Set(productsData.map((p) => p.type))], [productsData])
  const ORIGINS = useMemo(() => [...new Set(productsData.map((p) => p.origin))], [productsData])

  const filtered = useMemo(() => {
    let list = productsData.filter((p) => {
      if (search && !`${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase())) return false
      if (brand && p.brand !== brand) return false
      if (category && p.category !== category) return false
      if (type && p.type !== type) return false
      if (origin && p.origin !== origin) return false
      if (p.pricePerKg > maxPrice) return false
      if (p.rating < minRating) return false
      if (inStockOnly && p.stock <= 0) return false
      return true
    })
    switch (sort) {
      case 'price-asc': list = [...list].sort((a, b) => a.pricePerKg - b.pricePerKg); break
      case 'price-desc': list = [...list].sort((a, b) => b.pricePerKg - a.pricePerKg); break
      case 'rating': list = [...list].sort((a, b) => b.rating - a.rating); break
      case 'popularity': list = [...list].sort((a, b) => b.reviews - a.reviews); break
      default: list = [...list].reverse()
    }
    return list
  }, [productsData, search, brand, category, type, origin, maxPrice, minRating, inStockOnly, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const clearFilters = () => {
    setSearch(''); setBrand(''); setCategory(''); setType(''); setOrigin('')
    setMaxPrice(250); setMinRating(0); setInStockOnly(false); setSort('newest')
    setParams({})
  }

  const FiltersPanel = (
    <div className="space-y-6">
      <div>
        <p className="label-field">Search</p>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rice..." className="input-field" />
      </div>
      <div>
        <p className="label-field">Brand</p>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="input-field">
          <option value="">All Brands</option>
          {brandsData.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
        </select>
      </div>
      <div>
        <p className="label-field">Category</p>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
          <option value="">All Categories</option>
          {categoriesData.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <p className="label-field">Rice Type</p>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <p className="label-field">Origin</p>
        <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="input-field">
          <option value="">All Origins</option>
          {ORIGINS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <p className="label-field">Max Price: ₹{maxPrice}/kg</p>
        <input type="range" min={40} max={250} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="w-full accent-primary-500" />
      </div>
      <div>
        <p className="label-field">Minimum Rating</p>
        <div className="flex gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <button key={r} onClick={() => setMinRating(r)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${minRating === r ? 'bg-primary-500 text-white border-primary-500' : 'border-black/10'}`}>
              {r === 0 ? 'Any' : `${r}+`}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="accent-primary-500 w-4 h-4" />
        In Stock Only
      </label>
      <button onClick={clearFilters} className="btn-outline w-full text-sm">Clear All Filters</button>
    </div>
  )

  return (
    <div className="container-app py-8">
      <Breadcrumb items={[{ label: 'Shop' }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Shop Rice</h1>
          <p className="section-sub">{filtered.length} products found</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field !w-auto text-sm">
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="popularity">Popularity</option>
            <option value="rating">Highest Rated</option>
          </select>
          <button onClick={() => setFiltersOpen(true)} className="btn-outline lg:hidden text-sm py-2">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="hidden lg:block card p-5 h-fit sticky top-20">
          <h3 className="font-bold mb-4 flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters</h3>
          {FiltersPanel}
        </aside>

        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-80 bg-white p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Filters</h3>
                <button onClick={() => setFiltersOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              {FiltersPanel}
            </div>
          </div>
        )}

        <div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : pageItems.length === 0 ? (
            <EmptyState icon={PackageSearch} title="No products found" subtitle="Try adjusting your filters or search term." actionLabel="Clear Filters" actionTo="/products" />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {pageItems.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
