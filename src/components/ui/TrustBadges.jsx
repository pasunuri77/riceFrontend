import { motion } from 'framer-motion'
import { ShieldCheck, BadgeCheck, Receipt, Lock, Truck, RotateCcw, Award, PackageCheck } from 'lucide-react'

const BADGES = [
  { icon: ShieldCheck, label: 'FSSAI Certified' },
  { icon: BadgeCheck, label: 'ISO Quality' },
  { icon: Receipt, label: 'GST Billing' },
  { icon: Lock, label: 'Secure Payments' },
  { icon: Truck, label: 'Fast Delivery' },
  { icon: RotateCcw, label: 'Easy Returns' },
  { icon: Award, label: 'Quality Assured' },
  { icon: PackageCheck, label: 'Premium Packaging' },
]

export default function TrustBadges({ className = '' }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
      {BADGES.map((b, i) => (
        <motion.div
          key={b.label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="flex flex-col items-center text-center gap-2 rounded-xl bg-white border border-black/5 shadow-soft px-3 py-4"
        >
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
            <b.icon className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold text-ink/70 leading-tight">{b.label}</p>
        </motion.div>
      ))}
    </div>
  )
}
