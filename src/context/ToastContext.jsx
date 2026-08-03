import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, XCircle, X } from 'lucide-react'

const ToastContext = createContext(null)
const MAX_VISIBLE = 4
const DURATION = 3000

const ICONS = {
  success: <CheckCircle2 className="w-5 h-5 text-leaf-600" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-primary-500" />,
}

const BAR_COLORS = {
  success: 'bg-leaf-500',
  error: 'bg-red-500',
  info: 'bg-primary-500',
}

function Toast({ toast, onDismiss }) {
  const timerRef = useRef(null)
  const remainingRef = useRef(toast.duration)
  const startRef = useRef(Date.now())

  const clear = () => timerRef.current && clearTimeout(timerRef.current)

  const start = useCallback((ms) => {
    startRef.current = Date.now()
    timerRef.current = setTimeout(onDismiss, ms)
  }, [onDismiss])

  const pause = () => {
    clear()
    remainingRef.current -= Date.now() - startRef.current
  }

  const resume = () => start(Math.max(remainingRef.current, 200))

  useEffect(() => {
    start(remainingRef.current)
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      layout
      role="status"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40 }}
      onMouseEnter={pause}
      onMouseLeave={resume}
      className="card relative overflow-hidden flex items-center gap-3 px-4 py-3"
    >
      <span aria-hidden="true">{ICONS[toast.type]}</span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={onDismiss} aria-label="Dismiss notification" className="text-ink/40 hover:text-ink">
        <X className="w-4 h-4" />
      </button>
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${BAR_COLORS[toast.type]}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: toast.duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', duration = DURATION) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type, duration }].slice(-MAX_VISIBLE))
    window.dispatchEvent(new CustomEvent('app:notify', { detail: { message, type } }))
  }, [])

  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
