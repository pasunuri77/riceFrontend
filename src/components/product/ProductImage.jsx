import { Wheat } from 'lucide-react'
import { safeImageUrl } from '../../utils/sanitize'

// Falls back to a neutral rice-bag icon instead of a broken-image icon (or a fake
// stock photo pretending to be the product) when a product has no image yet.
export default function ProductImage({ src, alt = '', className = '', iconClassName = 'w-8 h-8' }) {
  const url = safeImageUrl(src)
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-primary-50 text-primary-300 ${className}`}>
        <Wheat className={iconClassName} aria-hidden="true" />
      </div>
    )
  }
  return <img src={url} alt={alt} loading="lazy" className={className} />
}
