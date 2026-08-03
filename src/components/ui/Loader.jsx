export default function Loader({ label = 'Loading...' }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" aria-hidden="true" />
      <p className="text-sm text-ink/60">{label}</p>
    </div>
  )
}
