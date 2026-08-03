import { motion } from 'framer-motion'

const TINTS = {
  primary: { icon: 'bg-primary-50 text-primary-600 ring-primary-100', bar: 'bg-primary-500' },
  leaf: { icon: 'bg-leaf-50 text-leaf-600 ring-leaf-100', bar: 'bg-leaf-500' },
  blue: { icon: 'bg-blue-50 text-blue-600 ring-blue-100', bar: 'bg-blue-500' },
  red: { icon: 'bg-red-50 text-red-600 ring-red-100', bar: 'bg-red-500' },
  amber: { icon: 'bg-amber-50 text-amber-600 ring-amber-100', bar: 'bg-amber-500' },
}

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
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ring-4 ${t.icon}`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink/50 font-medium truncate">{label}</p>
        {loading ? (
          <div className="skeleton h-6 w-16 mt-1.5" />
        ) : (
          <p className="text-2xl font-extrabold text-ink font-display truncate leading-tight mt-0.5">{value}</p>
        )}
        {sub && !loading && <p className="text-[11px] text-leaf-600 font-semibold mt-1">{sub}</p>}
      </div>
    </motion.div>
  )
}
