export function formatUSD(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// `fromDate` defaults to now (checkout preview, before an order exists) but should
// be passed an order's real placed-on date when estimating delivery for an order
// that already exists - otherwise every order looks like it ships N days from
// today regardless of when it was actually placed.
export function estimatedDelivery(daysFromNow = 4, fromDate = new Date()) {
  const d = new Date(fromDate)
  d.setDate(d.getDate() + daysFromNow)
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Picks a font-size class from `scale` (ordered largest to smallest, e.g.
// ['text-2xl', 'text-xl', 'text-lg']) based on how many characters `value` has,
// so a stat value shrinks to fit on one line instead of wrapping or getting
// truncated with an ellipsis. `charsPerStep` is how many extra characters push
// the value down to the next smaller size.
export function fitTextSizeClass(value, scale, charsPerStep = 3) {
  const length = String(value).length
  const index = Math.min(scale.length - 1, Math.floor(length / charsPerStep))
  return scale[index]
}
