import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Search, ShieldCheck, Truck, BadgePercent, Headphones, ArrowRight, Building2 } from 'lucide-react'
import productApi from '../../api/productApi'
import categoryApi from '../../api/categoryApi'
import brandApi from '../../api/brandApi'
import ProductCard from '../../components/product/ProductCard'
import CategoryCard from '../../components/product/CategoryCard'
import { ProductCardSkeleton, TextSkeleton } from '../../components/ui/Skeleton'
import TrustBadges from '../../components/ui/TrustBadges'
import AnimatedCounter from '../../components/ui/AnimatedCounter'
import QualityProcess from '../../components/home/QualityProcess'
import Testimonials from '../../components/home/Testimonials'
import FaqPreview from '../../components/home/FaqPreview'
import Newsletter from '../../components/home/Newsletter'

const WHY_US = [
  { icon: ShieldCheck, title: 'Quality Assured', desc: 'Every batch lab-tested for purity and grain quality.' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Pan-India delivery, from 1kg retail packs to bulk orders.' },
  { icon: BadgePercent, title: 'Best Prices', desc: 'Direct-from-mill sourcing means better prices for you.' },
  { icon: Headphones, title: '24/7 Support', desc: 'Dedicated support for individual and business buyers.' },
]

export default function Home() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      productApi.list().then(setProducts).catch(() => setProducts([])),
      categoryApi.list().then(setCategories).catch(() => setCategories([])),
      brandApi.list().then(setBrands).catch(() => setBrands([])),
    ]).finally(() => setLoading(false))
  }, [])

  const featured = products.filter((p) => p.badges.includes('Best Seller')).slice(0, 8)
  const offers = products.filter((p) => p.badges.includes('Limited Offer')).slice(0, 4)
  const latest = [...products].reverse().slice(0, 8)

  const submitSearch = (e) => {
    e.preventDefault()
    navigate(`/products?search=${encodeURIComponent(search)}`)
  }

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-cream to-leaf-50">
        <div className="container-app py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="badge bg-primary-100 text-primary-700 mb-4">🌾 Freshly Milled, Farm to Home</span>
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink leading-tight">
              Premium Rice, <span className="text-primary-600">Delivered</span> to Your Doorstep
            </h1>
            <p className="text-ink/60 mt-4 text-base sm:text-lg max-w-lg">
              From authentic Basmati to regional favorites like Sona Masoori and Gobindobhog — shop trusted Indian brands at the best prices.
            </p>

            <form onSubmit={submitSearch} className="mt-7 flex max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/30" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Basmati, Sona Masoori..."
                  className="w-full rounded-l-xl border border-black/10 pl-11 pr-4 py-3.5 text-sm outline-none focus:border-primary-400"
                />
              </div>
              <button className="btn-primary rounded-l-none px-6">Search</button>
            </form>

            <div className="flex gap-8 mt-8">
              <div>{loading ? <TextSkeleton className="h-7 w-10 mb-1" /> : <p className="text-2xl font-extrabold font-display text-primary-700"><AnimatedCounter value={brands.length} /></p>}<p className="text-xs text-ink/50">Trusted Brands</p></div>
              <div>{loading ? <TextSkeleton className="h-7 w-10 mb-1" /> : <p className="text-2xl font-extrabold font-display text-primary-700"><AnimatedCounter value={products.length} /></p>}<p className="text-xs text-ink/50">Rice Varieties</p></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="relative">
            <div className="aspect-square rounded-full bg-gradient-to-br from-primary-200 to-leaf-200 p-8 max-w-md mx-auto">
              <img
                src="https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=800&fit=crop&q=80"
                alt="Premium white rice grains"
                className="w-full h-full object-cover rounded-full shadow-cardHover"
              />
            </div>
            <div className="absolute -bottom-4 left-2 sm:left-8 card px-4 py-3 flex items-center gap-2">
              <span className="text-2xl">🚚</span>
              <div><p className="text-xs font-bold">Free Delivery</p><p className="text-[11px] text-ink/40">On orders above ₹10000</p></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="container-app py-10">
        <TrustBadges />
      </section>

      {/* Categories */}
      <section className="container-app py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-sub">Explore our wide range of rice categories</p>
          </div>
          <Link to="/products" className="hidden sm:flex items-center gap-1 text-primary-600 font-semibold text-sm">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)
            : categories.map((c, i) => <CategoryCard key={c.id} category={c} index={i} />)}
        </div>
      </section>

      {/* Featured Rice */}
      <section className="bg-white py-14">
        <div className="container-app">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="section-title">Featured Rice</h2>
              <p className="section-sub">Our most loved varieties, picked for you</p>
            </div>
            <Link to="/products" className="hidden sm:flex items-center gap-1 text-primary-600 font-semibold text-sm">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      <QualityProcess />

      {/* Popular Brands */}
      <section className="container-app py-14">
        <h2 className="section-title">Popular Brands</h2>
        <p className="section-sub mb-6">Shop from India's most trusted rice brands</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {loading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          {!loading && brands.slice(0, 12).map((b) => (
            <Link
              key={b.id}
              to={`/products?brand=${encodeURIComponent(b.name)}`}
              className="card flex flex-col items-center justify-center gap-2 p-4 hover:shadow-cardHover hover:-translate-y-1 transition-all"
            >
              <span className="text-3xl">{b.logo}</span>
              <p className="text-xs font-semibold text-center">{b.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Today's Offers */}
      <section className="bg-primary-600 py-14">
        <div className="container-app">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">🔥 Today's Offers</h2>
              <p className="text-white/70 mt-1">Limited time deals — grab them before they're gone</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : offers.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="container-app py-16">
        <div className="text-center mb-10">
          <h2 className="section-title">Why Choose RiceBazaar</h2>
          <p className="section-sub">Trusted by thousands of homes and businesses across India</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {WHY_US.map((w, i) => (
            <motion.div key={w.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card p-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
                <w.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm">{w.title}</h3>
              <p className="text-xs text-ink/50 mt-1.5 leading-relaxed">{w.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Testimonials />

      {/* Latest Arrivals */}
      <section className="container-app py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="section-title">Latest Arrivals</h2>
            <p className="section-sub">Freshly added to our catalogue</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : latest.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Business Customers Section */}
      <section className="container-app pb-16">
        <div className="rounded-2xl2 bg-gradient-to-br from-ink to-primary-900 text-white overflow-hidden relative">
          <div className="grid md:grid-cols-2 gap-8 items-center p-8 sm:p-12">
            <div>
              <span className="badge bg-white/10 text-white mb-4"><Building2 className="w-3.5 h-3.5" /> For Businesses</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display">Bulk Rice Supply for Stores &amp; Restaurants</h2>
              <p className="text-white/70 mt-3 max-w-md">Get wholesale pricing, GST invoicing and dedicated support for bulk orders.</p>
              <Link to="/contact" className="btn-primary mt-6 inline-flex">Contact Sales <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid grid-cols-1 gap-4 text-center">
              <div className="bg-white/10 rounded-xl p-4"><p className="text-2xl font-extrabold font-display">GST</p><p className="text-xs text-white/60 mt-1">Invoicing Supported</p></div>
            </div>
          </div>
        </div>
      </section>

      <FaqPreview />
      <Newsletter />
    </div>
  )
}
