import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, MapPin, CheckCircle2 } from 'lucide-react'
import useShopNowPath from '../../hooks/useShopNowPath'
import ZipDeliveryCheck from '../../components/home/ZipDeliveryCheck'
import { DELIVERY_AREAS, STORE_LOCATION } from '../../data/deliveryAreas'

export default function Home() {
  const shopNowPath = useShopNowPath()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 via-cream to-leaf-50">
        <div className="container-app py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="badge bg-primary-100 text-primary-700 mb-4">🌾 100% Natural</span>
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink leading-tight">
              Premium <span className="text-primary-600">Sona Masoori</span> Rice
            </h1>
            <p className="text-ink/60 mt-4 text-base sm:text-lg max-w-lg">
              Wholesome Sona Masoori Rice for everyday meals, carefully sourced and delivered to customers across selected areas of Austin, Texas.
            </p>

            <div className="mt-5 space-y-1.5 text-sm">
              <p className="text-ink/70">
                <span className="font-semibold text-ink">We currently deliver to:</span>{' '}
                {DELIVERY_AREAS.map((a) => a.name).join(', ')}
              </p>
              <p className="text-ink/70 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" aria-hidden="true" />
                <span className="font-semibold text-ink">Store Location:</span> {STORE_LOCATION.area}, {STORE_LOCATION.state}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Link to={shopNowPath} className="btn-primary shrink-0">
                <ShoppingBag className="w-4 h-4" aria-hidden="true" /> Shop Now
              </Link>
              <ZipDeliveryCheck compact />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            {/* Static decorative banner photo - intentionally not tied to any
                specific product's image, so a mistake on one product listing
                (wrong upload, missing photo) can never affect the homepage. */}
            <div className="aspect-square rounded-full bg-gradient-to-br from-primary-200 to-leaf-200 p-8 max-w-md mx-auto overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1586201375761-83865001e31c?w=900&h=900&fit=crop&q=80"
                alt="Sona Masoori Rice"
                className="w-full h-full object-cover rounded-full shadow-cardHover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Delivery areas */}
      <section className="container-app py-14 sm:py-16">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="badge bg-leaf-100 text-leaf-700 mb-3">📍 Greater Austin</span>
          <h2 className="section-title">Serving Austin, Texas</h2>
          <p className="text-ink/60 mt-2">Fresh Sona Masoori Rice delivered to your doorstep across selected Austin neighborhoods.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {DELIVERY_AREAS.map((area, i) => (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="card p-4 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-sm">{area.name}</h3>
              <p className="text-xs text-ink/50 mt-1.5 leading-relaxed">{area.description}</p>
              <span className="badge bg-leaf-100 text-leaf-700 text-[10px] mt-3 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Delivery Available
              </span>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3 mt-8">
          <p className="text-sm text-ink/50">
            Based in <span className="font-semibold text-ink">{STORE_LOCATION.area}, {STORE_LOCATION.city}, {STORE_LOCATION.stateCode}</span>
          </p>
          <ZipDeliveryCheck className="text-center" />
        </div>
      </section>
    </div>
  )
}
