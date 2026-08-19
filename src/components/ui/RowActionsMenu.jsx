import { AnimatePresence, motion } from 'framer-motion'
import { MoreVertical } from 'lucide-react'
import { useDropdown } from '../../hooks/useDropdown'

// Shared per-row "..." actions menu - every admin table (Products, Coupons,
// Orders, Payments, Customers) uses this instead of a row of separate icon
// buttons, so actions are readable text in one consistent dropdown everywhere.
// `items`: [{ label, icon?, onClick, danger?, disabled?, disabledReason? }]
export default function RowActionsMenu({ id, items, label = 'Row actions' }) {
  const { ref, isOpen, toggle, close } = useDropdown(id)

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={label}
        className="p-1.5 rounded-lg hover:bg-black/5 text-ink/50"
      >
        <MoreVertical className="w-4 h-4" aria-hidden="true" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            aria-label={label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 card p-1.5 w-44 z-40"
          >
            {items.map((item) => (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                title={item.disabled ? item.disabledReason : undefined}
                onClick={() => { if (item.disabled) return; close(); item.onClick() }}
                className={`w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${
                  item.danger ? 'text-red-500 hover:bg-red-50 disabled:hover:bg-transparent' : 'text-ink/70 hover:bg-primary-50 disabled:hover:bg-transparent'
                }`}
              >
                {item.icon && <item.icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
