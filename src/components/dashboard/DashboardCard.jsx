import { motion } from 'framer-motion'
import { fitTextSizeClass } from '../../utils/format'

const TINTS = {
  primary: { icon: 'bg-primary-50 text-primary-600 ring-primary-100', bar: 'bg-primary-500' },
  leaf: { icon: 'bg-leaf-50 text-leaf-600 ring-leaf-100', bar: 'bg-leaf-500' },
  blue: { icon: 'bg-blue-50 text-blue-600 ring-blue-100', bar: 'bg-blue-500' },
  red: { icon: 'bg-red-50 text-red-600 ring-red-100', bar: 'bg-red-500' },
  amber: { icon: 'bg-amber-50 text-amber-600 ring-amber-100', bar: 'bg-amber-500' },
}

const VALUE_SCALE = ['text-2xl', 'text-xl', 'text-lg', 'text-base']

export default function DashboardCard({ icon: Icon, label, value, sub, tint = 'primary', index = 0, loading = false }) {
  const t = TINTS[tint] || TINTS.primary
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card card-hover relative overflow-hidden p-4 sm:p-5 flex items-center gap-4"
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${t.bar}`} />
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ring-4 ${t.icon}`}>
        {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink/50 font-medium leading-snug">{label}</p>
        {loading ? (
          <div className="skeleton h-6 w-16 mt-1.5" />
        ) : (
          <p className={`${fitTextSizeClass(value, VALUE_SCALE, 4)} font-extrabold text-ink font-display leading-tight mt-0.5 whitespace-nowrap`}>{value}</p>
        )}
        {sub && !loading && <p className="text-[11px] text-leaf-600 font-semibold mt-1">{sub}</p>}
      </div>
    </motion.div>
  )
}
