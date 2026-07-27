export function ProductCardSkeleton() {
  return (
    <div className="card p-3">
      <div className="skeleton aspect-square w-full mb-3" />
      <div className="skeleton h-3 w-3/4 mb-2" />
      <div className="skeleton h-3 w-1/2 mb-3" />
      <div className="skeleton h-8 w-full" />
    </div>
  )
}

export function RowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export function TextSkeleton({ className = 'h-4 w-full' }) {
  return <div className={`skeleton ${className}`} />
}
