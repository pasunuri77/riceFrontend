export default function ChartCard({ title, sub, children, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="font-bold text-ink font-display">{title}</h3>
        {sub && <p className="text-xs text-ink/45 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}
