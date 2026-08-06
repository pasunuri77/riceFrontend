import { useLocation, Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

// A fresh key per route makes this remount (and re-animate in) on every
// navigation - the same remount React Router already does for the matched
// page component, just with a fade/slide instead of an instant swap.
export default function PageTransition() {
  const { pathname } = useLocation()
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <Outlet />
    </motion.div>
  )
}
