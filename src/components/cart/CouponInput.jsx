import { useState } from 'react'
import { Tag, X } from 'lucide-react'
import { useCart } from '../../context/CartContext'

export default function CouponInput() {
  const [code, setCode] = useState('')
  const { coupon, discountAmount, applyCoupon, removeCoupon, applyingCoupon } = useCart()

  const onApply = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    const ok = await applyCoupon(code)
    if (ok) setCode('')
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-2 bg-leaf-50 border border-leaf-200 rounded-lg px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Tag className="w-4 h-4 text-leaf-600 shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-leaf-700 truncate">{coupon.code}</span>
          <span className="text-xs text-leaf-600 shrink-0">-${discountAmount}</span>
        </div>
        <button type="button" onClick={removeCoupon} aria-label="Remove coupon" className="text-leaf-600 hover:text-leaf-800 shrink-0">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onApply} className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" aria-hidden="true" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          aria-label="Coupon code"
          className="input-field pl-9 text-sm"
        />
      </div>
      <button type="submit" disabled={applyingCoupon || !code.trim()} className="btn-outline text-sm px-4 disabled:opacity-50">
        {applyingCoupon ? 'Applying...' : 'Apply'}
      </button>
    </form>
  )
}
