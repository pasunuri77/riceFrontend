import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import useOnlineStatus from '../../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const online = useOnlineStatus()

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          role="status"
          aria-live="assertive"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[200] bg-ink text-white text-sm font-medium px-4 py-2 flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4" aria-hidden="true" /> You're offline — some features may not work until your connection is restored.
        </motion.div>
      )}
    </AnimatePresence>
  )
}
