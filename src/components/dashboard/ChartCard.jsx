export default function ChartCard({ title, sub, icon: Icon, children, className = '' }) {
  return (
    <div className={`card card-hover p-5 sm:p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-black/5">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-ink font-display">{title}</h3>
          {sub && <p className="text-xs text-ink/45 mt-0.5">{sub}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}
