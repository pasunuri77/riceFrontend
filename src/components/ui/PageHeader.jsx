export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold font-display text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink/50 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
