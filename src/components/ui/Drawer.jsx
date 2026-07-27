import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function Drawer({ open, onClose, title, children, side = 'right', width = 'max-w-md' }) {
  if (typeof document === 'undefined') return null
  const x = side === 'right' ? ['100%', '0%'] : ['-100%', '0%']

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: x[0] }}
            animate={{ x: x[1] }}
            exit={{ x: x[0] }}
            transition={{ type: 'tween', duration: 0.25 }}
            className={`relative ${side === 'right' ? 'ml-auto' : 'mr-auto'} h-full w-full ${width} bg-white shadow-2xl flex flex-col`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
              <h3 className="font-bold text-lg font-display">{title}</h3>
              <button onClick={onClose} className="text-ink/40 hover:text-ink hover:bg-black/5 rounded-full p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
