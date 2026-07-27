import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function EmptyState({ icon: Icon, title, subtitle, actionLabel, actionTo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16 px-4"
    >
      <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-4">
        {Icon && <Icon className="w-9 h-9 text-primary-400" />}
      </div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {subtitle && <p className="text-ink/50 text-sm mt-1 max-w-xs">{subtitle}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-5">
          {actionLabel}
        </Link>
      )}
    </motion.div>
  )
}
