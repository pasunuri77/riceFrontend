import { useState } from 'react'
import { Tag } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

// UI-only: there's no coupon/promo-code endpoint on the backend, so this
// deliberately never fakes a discount - it's an honest "not live yet" message
// rather than pretending to apply a real code.
export default function CouponInput() {
  const [code, setCode] = useState('')
  const [applying, setApplying] = useState(false)
  const { showToast } = useToast()

  const onApply = (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setApplying(true)
    setTimeout(() => {
      showToast('Coupon codes are coming soon - stay tuned!', 'info')
      setApplying(false)
    }, 400)
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
      <button type="submit" disabled={applying || !code.trim()} className="btn-outline text-sm px-4 disabled:opacity-50">
        {applying ? 'Applying...' : 'Apply'}
      </button>
    </form>
  )
}
