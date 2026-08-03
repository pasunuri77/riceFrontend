import { Search } from 'lucide-react'

export default function SearchInput({ value, onChange, placeholder = 'Search...', className = 'max-w-sm', inputClassName = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`input-field pl-10 ${inputClassName}`}
      />
    </div>
  )
}
