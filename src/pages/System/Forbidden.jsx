import { Link } from 'react-router-dom'
import { ShieldAlert, Home } from 'lucide-react'

export default function Forbidden() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div>
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="font-display font-extrabold text-6xl text-red-500">403</h1>
        <p className="text-lg font-semibold mt-3">Access Denied</p>
        <p className="text-ink/50 text-sm mt-2 max-w-sm mx-auto">
          You don't have permission to view this page.
        </p>
        <Link to="/" className="btn-primary text-sm mt-6 inline-flex">
          <Home className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  )
}
