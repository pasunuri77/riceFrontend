import { motion } from 'framer-motion'
import { Truck, PartyPopper } from 'lucide-react'
import { formatINR } from '../../utils/format'

export default function FreeShippingProgress({ subtotal, threshold }) {
  if (!threshold || threshold <= 0) return null

  const reached = subtotal >= threshold
  const percent = Math.min(100, Math.round((subtotal / threshold) * 100))
  const remaining = Math.max(0, threshold - subtotal)

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold mb-2">
        {reached ? <PartyPopper className="w-4 h-4 text-leaf-600" aria-hidden="true" /> : <Truck className="w-4 h-4 text-primary-600" aria-hidden="true" />}
        {reached ? (
          <span className="text-leaf-700">You've unlocked free delivery!</span>
        ) : (
          <span>Add <span className="text-primary-700">{formatINR(remaining)}</span> more for free delivery</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-black/5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${reached ? 'bg-leaf-500' : 'bg-primary-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
