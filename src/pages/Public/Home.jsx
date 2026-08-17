import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Store } from 'lucide-react'
import useShopNowPath from '../../hooks/useShopNowPath'
import ZipDeliveryCheck from '../../components/home/ZipDeliveryCheck'
import { ALL_LOCATION_NAMES, STORE_MAPS_URL } from '../../data/deliveryAreas'
import { useAuth } from '../../context/AuthContext'

export default function Home() {
  const shopNowPath = useShopNowPath()
  const { user } = useAuth()

  // Admins/employees land in their dashboard, not the storefront - the public
  // Home page has nothing for them to do, and this also covers navigating back
  // to "/" (e.g. the logo) while already signed in on the admin side.
  if (user?.role === 'admin' || user?.role === 'employee') {
    return <Navigate to="/admin" replace />
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 via-cream to-leaf-50">
        <div className="container-app py-6 sm:py-8 pb-12 sm:pb-16 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="badge bg-primary-100 text-primary-700 mb-3">🌾 100% Natural</span>
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink leading-tight">
              Premium <span className="text-primary-600">Sona Masoori</span> Rice
            </h1>
            <p className="text-ink/60 mt-3 text-base sm:text-lg max-w-lg">
              Fresh Sona Masoori Rice available for online delivery and in-store purchase across the Greater Austin region.
            </p>

            <div className="flex items-start gap-2 mt-4 text-sm">
              <ShoppingBag className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-ink leading-tight">Shop Online</p>
                <p className="text-ink/50 text-xs leading-tight">Order online, delivered to your door.</p>
              </div>
            </div>

            <div className="card border-primary-100 bg-white/70 p-4 mt-4 max-w-lg">
              <span className="badge bg-leaf-100 text-leaf-700 mb-2">📍 Serving Greater Austin, TX</span>
              <div className="flex flex-wrap gap-1.5">
                {ALL_LOCATION_NAMES.map((name) => (
                  <span key={name} className="rounded-full border border-primary-200 bg-primary-50/60 px-2.5 py-1 text-[11px] font-medium text-ink/70">
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <a
              href={STORE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 mt-4 text-sm group w-fit"
            >
              <Store className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-ink group-hover:text-primary-700 underline underline-offset-2 leading-tight">Visit Our Store</p>
                <p className="text-ink/50 text-xs leading-tight">Shop in person in North Austin - view on Google Maps.</p>
              </div>
            </a>

            <div className="flex flex-nowrap items-start gap-2 sm:gap-3 mt-6">
              <Link to={shopNowPath} className="btn-primary shrink-0 h-11 leading-none whitespace-nowrap">
                <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" /> Shop Now
              </Link>
              <ZipDeliveryCheck compact className="min-w-0" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            {/* Static decorative banner photo - intentionally not tied to any
                specific product's image, so a mistake on one product listing
                (wrong upload, missing photo) can never affect the homepage. */}
            <div className="aspect-square rounded-full bg-gradient-to-br from-primary-200 to-leaf-200 p-6 max-w-[380px] sm:max-w-[440px] mx-auto overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1586201375761-83865001e31c?w=900&h=900&fit=crop&q=80"
                alt="Sona Masoori Rice"
                className="w-full h-full object-cover rounded-full shadow-cardHover"
              />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
