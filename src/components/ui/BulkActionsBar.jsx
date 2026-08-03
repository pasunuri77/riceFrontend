export default function BulkActionsBar({ count, onClear, children }) {
  if (count === 0) return null
  return (
    <div role="status" aria-live="polite" className="flex flex-wrap items-center gap-3 bg-primary-50 border border-primary-200 rounded-xl px-4 py-2.5 mb-4 animate-fade-in">
      <span className="text-sm font-semibold text-primary-700">{count} selected</span>
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        {children}
        <button type="button" onClick={onClear} className="text-xs font-semibold text-ink/60 hover:text-ink px-2 py-1">Clear</button>
      </div>
    </div>
  )
}
