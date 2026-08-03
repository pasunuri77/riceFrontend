import { useState } from 'react'
import { Columns3 } from 'lucide-react'

export default function ColumnVisibilityMenu({ columns, visible, onToggle }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-outline text-sm py-2"
      >
        <Columns3 className="w-4 h-4" /> Columns
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div role="menu" aria-label="Toggle visible columns" className="absolute right-0 top-full mt-2 card p-2 w-52 z-40 max-h-72 overflow-y-auto">
            {columns.map((c) => (
              <label key={c.key} role="menuitemcheckbox" aria-checked={visible[c.key] !== false} className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-primary-50 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={visible[c.key] !== false}
                  onChange={() => onToggle(c.key)}
                  aria-label={`Toggle ${c.label} column`}
                  className="accent-primary-500 w-4 h-4"
                />
                {c.label}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
