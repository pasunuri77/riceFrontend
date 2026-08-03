import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  )

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Go to previous page"
        className="w-9 h-9 rounded-lg border border-black/10 flex items-center justify-center disabled:opacity-40 hover:bg-primary-50"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      </button>
      {pages.map((p, i) => (
        <div key={p} className="flex items-center gap-1.5">
          {i > 0 && pages[i - 1] !== p - 1 && <span aria-hidden="true" className="text-ink/30 px-1">…</span>}
          <button
            onClick={() => onChange(p)}
            aria-label={`Go to page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={`w-9 h-9 rounded-lg text-sm font-semibold ${
              p === page ? 'bg-primary-500 text-white' : 'border border-black/10 hover:bg-primary-50'
            }`}
          >
            {p}
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Go to next page"
        className="w-9 h-9 rounded-lg border border-black/10 flex items-center justify-center disabled:opacity-40 hover:bg-primary-50"
      >
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </nav>
  )
}
