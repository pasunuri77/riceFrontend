import { useEffect, useState } from 'react'
import couponApi from '../api/couponApi'

const RECHECK_MS = 60000

function isLive(coupon, now) {
  if (!coupon.active) return false
  if (!coupon.expiresAt) return true
  return new Date(coupon.expiresAt).getTime() > now
}

// Shared by anything that surfaces live coupons (offer strip, announcement ticker, ...).
// Re-checks every minute so an expired coupon drops out on its own without a page reload.
export default function useActiveCoupons() {
  const [coupons, setCoupons] = useState([])
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    couponApi.list().then(setCoupons).catch(() => setCoupons([]))
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), RECHECK_MS)
    return () => clearInterval(id)
  }, [])

  return coupons.filter((c) => isLive(c, now))
}
