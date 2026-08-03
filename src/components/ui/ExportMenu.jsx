import { useState } from 'react'
import { Download } from 'lucide-react'

export default function ExportMenu({ onExportCsv, onExportExcel }) {
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
        <Download className="w-4 h-4" /> Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div role="menu" aria-label="Export options" className="absolute right-0 top-full mt-2 card p-2 w-40 z-40">
            <button role="menuitem" type="button" onClick={() => { onExportCsv(); setOpen(false) }} className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-primary-50 text-sm">Export CSV</button>
            <button role="menuitem" type="button" onClick={() => { onExportExcel(); setOpen(false) }} className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-primary-50 text-sm">Export Excel</button>
          </div>
        </>
      )}
    </div>
  )
}
