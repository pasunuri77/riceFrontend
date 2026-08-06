export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function estimatedDelivery(daysFromNow = 4) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
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
