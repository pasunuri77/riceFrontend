// Best-effort client-side JWT expiry check. This is a UX/defense-in-depth
// measure only - the backend remains the sole source of truth for validity;
// we never trust the decoded payload for anything security-sensitive.
export function isTokenExpired(token) {
  if (!token) return true
  const parts = token.split('.')
  if (parts.length !== 3) return true

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (!payload.exp) return false
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}
