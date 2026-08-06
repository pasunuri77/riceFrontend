import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
const DEFAULT_MAX_PRICE = 250

// Single source of truth for which filter keys exist and their default ("unset")
// value - used both to build the URL query string and to read it back on load,
// so a filtered URL can be shared/bookmarked/refreshed without losing state.
const FILTER_DEFAULTS = {
  search: '', brand: '', category: '', type: '', origin: '', tag: '', pack: '',
  maxPrice: DEFAULT_MAX_PRICE, minRating: 0, inStockOnly: false, sort: 'newest', page: 1,
}

function readParam(params, key, isNumber, isBoolean) {
  const raw = params.get(key)
  if (raw === null) return FILTER_DEFAULTS[key]
  if (isBoolean) return raw === 'true'
  if (isNumber) return Number(raw)
  return raw
}

export default function Products() {
  const [params, setParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [productsData, setProductsData] = useState([])
  const [brandsData, setBrandsData] = useState([])
  const [categoriesData, setCategoriesData] = useState([])

  const [search, setSearch] = useState(() => readParam(params, 'search'))
  const [brand, setBrand] = useState(() => readParam(params, 'brand'))
  const [category, setCategory] = useState(() => readParam(params, 'category'))
  const [type, setType] = useState(() => readParam(params, 'type'))
  const [origin, setOrigin] = useState(() => readParam(params, 'origin'))
  const [tag, setTag] = useState(() => readParam(params, 'tag'))
  const [pack, setPack] = useState(() => readParam(params, 'pack'))
  const [maxPrice, setMaxPrice] = useState(() => readParam(params, 'maxPrice', true))
  const [minRating, setMinRating] = useState(() => readParam(params, 'minRating', true))
  const [inStockOnly, setInStockOnly] = useState(() => readParam(params, 'inStockOnly', false, true))
  const [sort, setSort] = useState(() => readParam(params, 'sort'))
  const [page, setPage] = useState(() => readParam(params, 'page', true))

  useEffect(() => {
    setLoading(true)
    Promise.all([productApi.list(), brandApi.list(), categoryApi.list()])
      .then(([products, brands, categories]) => {
        setProductsData(products)
        setBrandsData(brands)
        setCategoriesData(categories)
      })
      .catch(() => {
        setProductsData([])
        setBrandsData([])
        setCategoriesData([])
      })
      .finally(() => setLoading(false))
  }, [])

  // Reset to page 1 whenever a filter (anything other than page itself) changes.
  useEffect(() => setPage(1), [search, brand, category, type, origin, tag, pack, maxPrice, minRating, inStockOnly, sort])

  // Keep the URL in sync with every filter so the current view is shareable,
  // bookmarkable, and survives a refresh or browser back/forward.
  useEffect(() => {
    const current = { search, brand, category, type, origin, tag, pack, maxPrice, minRating, inStockOnly, sort, page }
    const next = new URLSearchParams()
    Object.entries(current).forEach(([key, value]) => {
      if (value !== FILTER_DEFAULTS[key] && value !== '' ) next.set(key, value)
    })
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, brand, category, type, origin, tag, pack, maxPrice, minRating, inStockOnly, sort, page])

  const TYPES = useMemo(() => [...new Set(productsData.map((p) => p.type))].filter(Boolean), [productsData])
  const ORIGINS = useMemo(() => [...new Set(productsData.map((p) => p.origin))].filter(Boolean), [productsData])
  const TAGS = useMemo(() => [...new Set(productsData.flatMap((p) => p.badges || []))].filter(Boolean), [productsData])
  const PACK_SIZES = useMemo(() => [...new Set(productsData.flatMap((p) => p.weightOptions || []))].sort((a, b) => a - b), [productsData])

  const filtered = useMemo(() => {
    let list = productsData.filter((p) => {
      if (search && !`${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase())) return false
      if (brand && p.brand !== brand) return false
      if (category && p.category !== category) return false
      if (type && p.type !== type) return false
      if (origin && p.origin !== origin) return false
      if (tag && !(p.badges || []).includes(tag)) return false
      if (pack && !(p.weightOptions || []).includes(Number(pack))) return false
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
  }, [productsData, search, brand, category, type, origin, tag, pack, maxPrice, minRating, inStockOnly, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const clearFilters = () => {
    setSearch(FILTER_DEFAULTS.search); setBrand(FILTER_DEFAULTS.brand); setCategory(FILTER_DEFAULTS.category)
    setType(FILTER_DEFAULTS.type); setOrigin(FILTER_DEFAULTS.origin); setTag(FILTER_DEFAULTS.tag); setPack(FILTER_DEFAULTS.pack)
    setMaxPrice(FILTER_DEFAULTS.maxPrice); setMinRating(FILTER_DEFAULTS.minRating)
    setInStockOnly(FILTER_DEFAULTS.inStockOnly); setSort(FILTER_DEFAULTS.sort)
  }

  const activeChips = [
    search && { key: 'search', label: `"${search}"`, clear: () => setSearch('') },
    brand && { key: 'brand', label: brand, clear: () => setBrand('') },
    category && { key: 'category', label: category, clear: () => setCategory('') },
    type && { key: 'type', label: type, clear: () => setType('') },
    origin && { key: 'origin', label: origin, clear: () => setOrigin('') },
    tag && { key: 'tag', label: tag, clear: () => setTag('') },
    pack && { key: 'pack', label: `${pack}kg pack`, clear: () => setPack('') },
    maxPrice !== DEFAULT_MAX_PRICE && { key: 'maxPrice', label: `Under ₹${maxPrice}/kg`, clear: () => setMaxPrice(DEFAULT_MAX_PRICE) },
    minRating > 0 && { key: 'minRating', label: `${minRating}+ rating`, clear: () => setMinRating(0) },
    inStockOnly && { key: 'inStockOnly', label: 'In Stock Only', clear: () => setInStockOnly(false) },
  ].filter(Boolean)

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
      {TAGS.length > 0 && (
        <div>
          <p className="label-field">Tags</p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button key={t} onClick={() => setTag(tag === t ? '' : t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${tag === t ? 'bg-primary-500 text-white border-primary-500' : 'border-black/10 hover:border-primary-300'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      {PACK_SIZES.length > 0 && (
        <div>
          <p className="label-field">Pack Size</p>
          <div className="flex flex-wrap gap-2">
            {PACK_SIZES.map((w) => (
              <button key={w} onClick={() => setPack(pack === String(w) ? '' : String(w))} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${pack === String(w) ? 'bg-primary-500 text-white border-primary-500' : 'border-black/10 hover:border-primary-300'}`}>
                {w}kg
              </button>
            ))}
          </div>
        </div>
      )}
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
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

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <AnimatePresence>
            {activeChips.map((chip) => (
              <motion.button
                key={chip.key}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={chip.clear}
                className="flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full pl-3 pr-2 py-1.5 hover:bg-primary-100"
              >
                {chip.label}
                <X className="w-3 h-3" aria-hidden="true" />
              </motion.button>
            ))}
          </AnimatePresence>
          <button onClick={clearFilters} className="text-xs font-semibold text-ink/50 hover:text-ink px-2 py-1.5">Clear all</button>
        </div>
      )}

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="hidden lg:block card p-5 h-fit sticky top-20">
          <h3 className="font-bold mb-4 flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters</h3>
          {FiltersPanel}
        </aside>

        <AnimatePresence>
          {filtersOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
              <motion.div
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.25 }}
                className="absolute left-0 top-0 h-full w-80 bg-white shadow-cardHover p-5 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Filters</h3>
                  <button onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X className="w-5 h-5" /></button>
                </div>
                {FiltersPanel}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : pageItems.length === 0 ? (
            <EmptyState icon={PackageSearch} title="No products found" subtitle="Try adjusting your filters or search term." actionLabel="Clear Filters" onAction={clearFilters} />
          ) : (
            <>
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                <AnimatePresence mode="popLayout">
                  {pageItems.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                </AnimatePresence>
              </motion.div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
