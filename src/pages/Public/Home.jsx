import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'

export default function Home() {
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
              Naturally wholesome rice for everyday meals - light, aromatic, and grown for consistent quality in every batch.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/products" className="btn-primary">
                <ShoppingBag className="w-4 h-4" aria-hidden="true" /> Shop Now
              </Link>
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
    </div>
  )
}
