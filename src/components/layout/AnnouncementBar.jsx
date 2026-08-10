import { Tag, Truck, ShieldCheck, BadgeCheck, Receipt, RotateCcw } from 'lucide-react'
import useActiveCoupons from '../../hooks/useActiveCoupons'

const TRUST_ITEMS = [
  { icon: Truck, text: 'Free Delivery above ₹10,000' },
  { icon: ShieldCheck, text: 'FSSAI Certified Quality' },
  { icon: BadgeCheck, text: 'ISO Certified Standards' },
  { icon: Receipt, text: 'GST Billing on Every Order' },
  { icon: RotateCcw, text: 'Easy Returns' },
]

// A native <marquee> replacement: a plain CSS @keyframes loop rather than a JS
// animation library, since the app already leans on CSS/Tailwind for this kind
// of continuous motion and it avoids a extra runtime dependency.
export default function AnnouncementBar() {
  const liveCoupons = useActiveCoupons()

  const couponItems = liveCoupons.map((c) => ({
    icon: Tag,
    text: (c.type || '').toUpperCase() === 'PERCENT' ? `Use code ${c.code} for ${c.value}% OFF` : `Use code ${c.code} for ₹${c.value} OFF`,
  }))

  const items = [...couponItems, ...TRUST_ITEMS]
  // Duplicated so the track can loop seamlessly: translating the whole track by
  // exactly -50% of its width always lands back on an identical starting frame.
  const track = [...items, ...items]
  const duration = Math.max(18, items.length * 4)

  return (
    <div className="bg-ink text-white overflow-hidden" role="marquee" aria-label="Offers and store information">
      <div
        className="rb-marquee-track flex items-center gap-10 py-2 whitespace-nowrap w-max"
        style={{ '--rb-marquee-duration': `${duration}s` }}
      >
        {track.map((item, i) => (
          <span key={i} aria-hidden={i >= items.length} className="flex items-center gap-2 text-xs font-semibold px-2 shrink-0">
            <item.icon className="w-3.5 h-3.5 text-primary-300 shrink-0" aria-hidden="true" />
            {item.text}
          </span>
        ))}
      </div>
      <style>{`
        .rb-marquee-track {
          animation: rb-marquee var(--rb-marquee-duration) linear infinite;
        }
        .rb-marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes rb-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rb-marquee-track { animation: none; }
        }
      `}</style>
    </div>
  )
}
