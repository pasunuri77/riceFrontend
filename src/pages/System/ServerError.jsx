import { Link } from 'react-router-dom'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default function ServerError({ onRetry }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div>
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="font-display font-extrabold text-6xl text-amber-500">500</h1>
        <p className="text-lg font-semibold mt-3">Something Went Wrong</p>
        <p className="text-ink/50 text-sm mt-2 max-w-sm mx-auto">
          An unexpected error occurred. Try again, and if the problem persists, please come back later.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={onRetry || (() => window.location.reload())} className="btn-outline text-sm">
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <Link to="/" className="btn-primary text-sm">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
