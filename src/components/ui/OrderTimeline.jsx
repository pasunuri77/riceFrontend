import { motion } from 'framer-motion'
import { ClipboardCheck, PackageCheck, Truck, Home, XCircle } from 'lucide-react'

// Only the delivery stages the backend's DeliveryStatus enum actually has
// (Pending/Processing/Shipped/Delivered) - "Packed" and "Out For Delivery" aren't
// real statuses this app can set or receive, so they're left out rather than
// shown as steps that can never actually complete.
const STEPS = [
  { status: 'Pending', label: 'Order Placed', icon: ClipboardCheck },
  { status: 'Processing', label: 'Processing', icon: PackageCheck },
  { status: 'Shipped', label: 'Shipped', icon: Truck },
  { status: 'Delivered', label: 'Delivered', icon: Home },
]

export default function OrderTimeline({ status }) {
  if (status === 'Cancelled') {
    return (
      <div className="flex items-center gap-3 text-red-600">
        <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <XCircle className="w-4 h-4" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold">This order was cancelled.</p>
      </div>
    )
  }

  const currentIndex = STEPS.findIndex((s) => s.status === status)

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'future'
        const dotClass = state === 'done' ? 'bg-leaf-500 text-white' : state === 'current' ? 'bg-amber-500 text-white' : 'bg-black/10 text-ink/30'
        const labelClass = state === 'done' ? 'text-leaf-700' : state === 'current' ? 'text-amber-700' : 'text-ink/40'
        return (
          <div key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dotClass}`}
              >
                <step.icon className="w-4 h-4" aria-hidden="true" />
              </motion.div>
              {i < STEPS.length - 1 && <div className={`w-0.5 flex-1 min-h-[24px] ${state === 'done' ? 'bg-leaf-400' : 'bg-black/10'}`} />}
            </div>
            <p className={`text-sm font-semibold pb-6 ${labelClass}`}>{step.label}</p>
          </div>
        )
      })}
    </div>
  )
}
