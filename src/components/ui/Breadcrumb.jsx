import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center flex-wrap gap-1.5 text-sm text-ink/50 mb-4">
      <Link to="/" className="hover:text-primary-600 flex items-center gap-1">
        <Home className="w-3.5 h-3.5" /> Home
      </Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5" />
          {it.to ? (
            <Link to={it.to} className="hover:text-primary-600">{it.label}</Link>
          ) : (
            <span className="text-ink font-medium">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
