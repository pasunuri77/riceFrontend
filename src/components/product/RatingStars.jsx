import { Star } from 'lucide-react'

export default function RatingStars({ rating, size = 'w-3.5 h-3.5', showValue = true, reviews }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${size} ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-black/10 text-black/10'}`}
          />
        ))}
      </div>
      {showValue && <span className="text-xs font-semibold text-ink/70">{rating}</span>}
      {reviews !== undefined && <span className="text-xs text-ink/40">({reviews})</span>}
    </div>
  )
}
