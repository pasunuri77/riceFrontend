function toCsvValue(v) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** columns: [{ label, value: (row) => string }] */
export function exportToCsv(filename, columns, rows) {
  const header = columns.map((c) => toCsvValue(c.label)).join(',')
  const body = rows.map((r) => columns.map((c) => toCsvValue(c.value(r))).join(',')).join('\n')
  downloadBlob(`${header}\n${body}`, `${filename}.csv`, 'text/csv;charset=utf-8;')
}

/** Produces a real Excel-openable .xls file (HTML table trick) with zero extra npm dependencies. */
export function exportToExcel(filename, columns, rows) {
  const headerRow = `<tr>${columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('')}</tr>`
  const bodyRows = rows.map((r) => `<tr>${columns.map((c) => `<td>${escapeHtml(c.value(r))}</td>`).join('')}</tr>`).join('')
  const html = `<html><head><meta charset="UTF-8"></head><body><table border="1">${headerRow}${bodyRows}</table></body></html>`
  downloadBlob(html, `${filename}.xls`, 'application/vnd.ms-excel;charset=utf-8;')
}
