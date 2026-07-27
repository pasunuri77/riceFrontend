import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function CategoryCard({ category, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        to={`/products?category=${encodeURIComponent(category.name)}`}
        className="group relative flex flex-col items-center gap-2 rounded-2xl bg-white border border-black/5 shadow-card hover:shadow-cardHover hover:-translate-y-1 transition-all duration-300 p-4"
      >
        <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-50 flex items-center justify-center text-3xl">
          {category.image ? (
            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
          ) : (
            category.icon
          )}
        </div>
        <p className="text-sm font-semibold text-center text-ink group-hover:text-primary-600">{category.name}</p>
        <p className="text-xs text-ink/40">{category.count} items</p>
      </Link>
    </motion.div>
  )
}
