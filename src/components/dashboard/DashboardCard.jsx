import { motion } from 'framer-motion'

export default function DashboardCard({ icon: Icon, label, value, sub, tint = 'primary', index = 0 }) {
  const tints = {
    primary: 'bg-primary-50 text-primary-600',
    leaf: 'bg-leaf-50 text-leaf-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card p-4 sm:p-5 flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tints[tint]}`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink/50 font-medium truncate">{label}</p>
        <p className="text-xl font-extrabold text-ink font-display truncate">{value}</p>
        {sub && <p className="text-[11px] text-leaf-600 font-medium mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  )
}
