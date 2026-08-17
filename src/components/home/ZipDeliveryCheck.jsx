import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { findGreaterAustinAreaForZip } from '../../data/deliveryAreas'

// Auto-checks as soon as 5 digits are entered - no separate "Check" button.
// Informational only: matches against the Greater Austin store location
// (named zones + sub-cities), not the real backend delivery-check.
export default function ZipDeliveryCheck({ className = '', compact = false }) {
  const [zip, setZip] = useState('')
  const [result, setResult] = useState(null) // null | { areaName, isNamedZone } | 'not-found'

  useEffect(() => {
    if (zip.length !== 5) {
      setResult(null)
      return
    }
    setResult(findGreaterAustinAreaForZip(zip) || 'not-found')
  }, [zip])

  return (
    <div className={className}>
      <input
        value={zip}
        onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
        type="text"
        inputMode="numeric"
        maxLength={5}
        placeholder="Search your ZIP code"
        aria-label="Check delivery availability by ZIP code"
        className={`input-field ${compact ? 'w-full min-w-[110px] sm:w-40 text-xs h-11 py-0' : 'max-w-xs'}`}
      />
      <div className={`mt-2 ${compact ? 'min-h-[16px]' : 'min-h-[20px]'}`}>
        {result && result !== 'not-found' && (
          <p className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'} text-leaf-600 font-semibold`}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> Great! We deliver to {result.areaName}.
          </p>
        )}
        {result === 'not-found' && (
          <p className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'} text-red-500 font-semibold`}>
            <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> Sorry, we don't currently deliver to this ZIP code.
          </p>
        )}
      </div>
    </div>
  )
}
