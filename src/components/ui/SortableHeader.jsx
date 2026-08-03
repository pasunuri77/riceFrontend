import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export default function SortableHeader({ label, sortKey, sort, onSort, className = '' }) {
  const active = sort?.key === sortKey
  const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <th scope="col" aria-sort={ariaSort} className={`p-3.5 select-none ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}${active ? `, currently ${ariaSort}` : ''}`}
        className="flex items-center gap-1 hover:text-primary-600 transition-colors"
      >
        {label}
        {active ? (
          sort.dir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
        ) : (
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-30" aria-hidden="true" />
        )}
      </button>
    </th>
  )
}
