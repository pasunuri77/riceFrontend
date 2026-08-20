import { formatUSD, formatDate } from './format'
import { bagWeightLb } from './stock'
import { paymentMethodLabel } from '../data/returnRequests'

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

const itemsSummary = (o) => (o.items?.length ? o.items.map((i) => i.name).join(', ') : o.riceName)

// There's no backend invoice record (no invoice number/id is ever generated
// server-side) - this derives a stable, unique-enough number straight from
// the order's own id, so it's real data rather than a fabricated placeholder,
// and reruns of the same order always produce the same invoice number.
export function invoiceNumberFor(order) {
  return `INV-${order.id}`
}

// Client-only invoice, built entirely from data the customer already has
// access to (their own order + their own account email) - opens a print
// window the customer can "Save as PDF" from, same approach already used for
// the admin-side invoice. No backend endpoint exists for this yet and none
// is needed since nothing here requires data outside what /api/orders/:id
// and the logged-in user object already provide.
export function openInvoice(order, user) {
  const win = window.open('', '_blank')
  if (!win) return

  const rows = (order.items?.length ? order.items : [{ name: itemsSummary(order), weight: '', qty: 1, pricePerKg: 0 }])
    .map((i) => {
      const lineTotal = (i.pricePerKg || 0) * (i.weight || 0) * (i.qty || 1)
      return `<tr>
        <td>${escapeHtml(i.name)}</td>
        <td>${i.weight ? `${escapeHtml(bagWeightLb(i.weight))} lb` : '--'}</td>
        <td>${escapeHtml(i.qty)}</td>
        <td>${formatUSD((i.pricePerKg || 0) * (i.weight || 0))}</td>
        <td>${formatUSD(lineTotal)}</td>
      </tr>`
    })
    .join('')

  const invoiceNumber = invoiceNumberFor(order)

  win.document.write(`
    <html><head><title>Invoice ${escapeHtml(invoiceNumber)}</title>
    <style>
      body{font-family:Segoe UI,Arial,sans-serif;color:#111;padding:32px;max-width:640px;margin:auto}
      h1{font-size:20px;margin:0 0 4px}
      .muted{color:#666;font-size:13px}
      .addresses{display:flex;gap:32px;margin-top:20px}
      .addresses>div{flex:1}
      .addresses h3{font-size:12px;text-transform:uppercase;letter-spacing:.03em;color:#888;margin:0 0 4px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{text-align:left;padding:8px;border-bottom:1px solid #eee;font-size:13px}
      .totals td{border:none;padding:4px 8px}
      .totals tr:last-child td{border-top:1px solid #ddd;padding-top:8px}
    </style></head>
    <body>
      <h1>RiceBazaar</h1>
      <p class="muted">Invoice ${escapeHtml(invoiceNumber)} • Order ${escapeHtml(order.id)} • ${escapeHtml(formatDate(order.date))}</p>

      <div class="addresses">
        <div>
          <h3>Billed To</h3>
          <p>${escapeHtml(order.customerName || '--')}</p>
          ${user?.email ? `<p>${escapeHtml(user.email)}</p>` : ''}
        </div>
        <div>
          <h3>Delivery Address</h3>
          <p>${escapeHtml(order.address || '--')}</p>
        </div>
      </div>

      <table><thead><tr><th>Product</th><th>Bag Size</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
      <table class="totals" style="margin-top:8px">
        <tr><td>Subtotal</td><td style="text-align:right">${formatUSD(order.subtotal)}</td></tr>
        ${order.offerDiscount > 0 ? `<tr><td>Offer Discount</td><td style="text-align:right">-${formatUSD(order.offerDiscount)}</td></tr>` : ''}
        ${order.discountAmount > 0 ? `<tr><td>Coupon Discount${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ''}</td><td style="text-align:right">-${formatUSD(order.discountAmount)}</td></tr>` : ''}
        <tr><td>Delivery</td><td style="text-align:right">${order.deliveryCharge > 0 ? formatUSD(order.deliveryCharge) : 'Free'}</td></tr>
        <tr><td>Tax</td><td style="text-align:right">${formatUSD(order.tax)}</td></tr>
        <tr><td><strong>Total</strong></td><td style="text-align:right"><strong>${formatUSD(order.amount)}</strong></td></tr>
      </table>
      <p class="muted" style="margin-top:24px">Payment Method: ${escapeHtml(paymentMethodLabel(order))} &middot; Payment Status: ${escapeHtml(order.paymentStatus)}</p>
    </body></html>
  `)
  win.document.close()
  win.focus()
  win.print()
}
