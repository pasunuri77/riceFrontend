const SAFE_IMAGE_PROTOCOL = /^https?:\/\//i

// Guards against non-http(s) schemes (javascript:, data:, vbscript:...) ending up
// in a rendered `src`/`href` from data that ultimately originates from user input
// (e.g. a product image URL typed into an admin form).
export function safeImageUrl(url, fallback = '') {
  return typeof url === 'string' && SAFE_IMAGE_PROTOCOL.test(url) ? url : fallback
}
