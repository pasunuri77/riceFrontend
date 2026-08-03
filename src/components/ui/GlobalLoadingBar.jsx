import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function GlobalLoadingBar() {
  const location = useLocation()
  const navType = useNavigationType()
  const [active, setActive] = useState(false)
  const timerRef = useRef(null)
  const firstRun = useRef(true)

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    setActive(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setActive(false), 450)
    return () => clearTimeout(timerRef.current)
  }, [location.pathname, navType])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ transformOrigin: 'left' }}
          className="fixed top-0 left-0 right-0 h-0.5 bg-primary-500 z-[300]"
        />
      )}
    </AnimatePresence>
  )
}
