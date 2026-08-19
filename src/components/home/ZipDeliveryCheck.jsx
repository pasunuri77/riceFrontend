import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import deliveryApi from '../../api/deliveryApi'

export default function ZipDeliveryCheck({ className = '', compact = false }) {
  const [zip, setZip] = useState('')
  const [result, setResult] = useState(null) // null | 'checking' | 'error' | serviceability
  const requestIdRef = useRef(0)

  useEffect(() => {
    const currentRequest = requestIdRef.current + 1
    requestIdRef.current = currentRequest

    if (zip.length !== 5) {
      setResult(null)
      return undefined
    }

    setResult('checking')
    const t = setTimeout(() => {
      deliveryApi.check(zip)
        .then((res) => {
          if (requestIdRef.current === currentRequest) setResult(res)
        })
        .catch(() => {
          if (requestIdRef.current === currentRequest) setResult('error')
        })
    }, 250)

    return () => clearTimeout(t)
  }, [zip])

  const isAvailable = result?.deliverable
  const isUnavailable = result && result !== 'checking' && result !== 'error' && !result.deliverable

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
        {result === 'checking' && (
          <p className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'} text-ink/40 font-semibold`}>
            <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" aria-hidden="true" /> Checking delivery...
          </p>
        )}
        {isAvailable && (
          <p className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'} text-leaf-600 font-semibold`}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> Great! We deliver to {result.areaName || result.zipCode}.
          </p>
        )}
        {isUnavailable && (
          <p className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'} text-red-500 font-semibold`}>
            <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> Sorry, we don't currently deliver to this ZIP code.
          </p>
        )}
        {result === 'error' && (
          <p className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'} text-red-500 font-semibold`}>
            <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> We couldn't check the delivery area right now. Please try again.
          </p>
        )}
      </div>
    </div>
  )
}
