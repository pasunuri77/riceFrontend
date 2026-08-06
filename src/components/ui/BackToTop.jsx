import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 w-10 h-10 rounded-full bg-primary-500 text-white shadow-cardHover flex items-center justify-center hover:bg-primary-600"
        >
          <ArrowUp className="w-4.5 h-4.5" aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
