import { motion } from 'framer-motion'
import { ClipboardCheck, PackageCheck, Truck, Home } from 'lucide-react'

const STEPS = [
  { key: 'Placed', label: 'Order Placed', icon: ClipboardCheck },
  { key: 'Processing', label: 'Processing', icon: PackageCheck },
  { key: 'Shipped', label: 'Shipped', icon: Truck },
  { key: 'Delivered', label: 'Delivered', icon: Home },
]

// currentIndex: how many steps are complete (0 = just placed).
export default function DeliveryTimeline({ currentIndex = 0 }) {
  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center text-center relative">
            {i > 0 && (
              <div className="absolute top-4 right-1/2 w-full h-0.5 -z-10">
                <div className={`h-full ${i <= currentIndex ? 'bg-primary-500' : 'bg-black/10'}`} />
              </div>
            )}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-primary-500 text-white' : 'bg-black/5 text-ink/30'}`}
            >
              <step.icon className="w-4 h-4" aria-hidden="true" />
            </motion.div>
            <p className={`text-[11px] font-semibold mt-2 ${done ? 'text-ink' : 'text-ink/40'}`}>{step.label}</p>
          </div>
        )
      })}
    </div>
  )
}
