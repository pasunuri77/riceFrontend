import { Loader2 } from 'lucide-react'

export default function SubmitButton({ loading, children, className = 'btn-primary w-full', loadingLabel = 'Please wait...', ...rest }) {
  return (
    <button type="submit" className={className} disabled={loading || rest.disabled} aria-busy={loading} {...rest}>
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}
