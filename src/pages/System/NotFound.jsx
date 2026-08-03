import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div>
        <p className="text-7xl mb-2">🌾</p>
        <h1 className="font-display font-extrabold text-6xl text-primary-600">404</h1>
        <p className="text-lg font-semibold mt-3">Page Not Found</p>
        <p className="text-ink/50 text-sm mt-2 max-w-sm mx-auto">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => window.history.back()} className="btn-outline text-sm">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link to="/" className="btn-primary text-sm">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
