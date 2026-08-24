import { isTokenExpired } from '../utils/jwt'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const TOKEN_KEY = 'rb_token'

export function getToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  // A locally-expired token can never succeed against the backend - treat it as
  // absent so we don't attach a doomed Authorization header to every request.
  if (token && isTokenExpired(token)) {
    setToken(null)
    window.dispatchEvent(new Event('auth:invalid'))
    return null
  }
  return token
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

const RETRYABLE_STATUS = new Set([502, 503, 504])
const MAX_RETRIES = 2

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function request(path, { method = 'GET', body } = {}, attempt = 0) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (networkErr) {
    // fetch throwing means the request never reached the server at all (offline,
    // DNS failure, connection refused) - safe to retry regardless of HTTP method.
    if (attempt < MAX_RETRIES) {
      await delay(500 * (attempt + 1))
      return request(path, { method, body }, attempt + 1)
    }
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 0, null)
  }

  if (res.status === 204) return null

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null

  if (!res.ok) {
    // A 401 while holding a token means that token itself is stale/invalid (expired,
    // revoked, or the account behind it no longer exists) - drop it so it stops
    // poisoning every subsequent request, including ones that don't even require auth.
    // A 403 is different: the session is still valid, the caller just lacks permission
    // for this one action - forcing a full logout there would kill a legitimate
    // session over a single denied request, so we leave the token alone.
    //
    // Deliberately NOT treating 500 the same as 401 here (it used to be): the backend's
    // JwtAuthFilter can throw an uncaught UsernameNotFoundException for a token whose
    // account no longer exists, which surfaces as a 500 instead of the 401 it should be
    // (see BACKEND_TODO) - but 500 is also the generic "something threw on the server"
    // status for completely unrelated failures (e.g. a validation crash while saving an
    // address). Force-logging-out on every 500 meant any unrelated server error during
    // checkout/address-save got misreported as "your session has expired" instead of the
    // real failure, and silently discarded whatever the user was in the middle of doing.
    // The real fix for the JwtAuthFilter case belongs server-side; this is not a stand-in
    // for it.
    if (token && res.status === 401) {
      setToken(null)
      window.dispatchEvent(new Event('auth:invalid'))
    }
    // Only retry GET requests on transient server errors - retrying a POST/PUT/DELETE
    // here is unsafe since the server already received and may have processed it.
    if (method === 'GET' && RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
      await delay(500 * (attempt + 1))
      return request(path, { method, body }, attempt + 1)
    }
    // Never surface raw 5xx bodies to the UI - the backend may include stack traces
    // or internal details in error responses that shouldn't be shown to end users.
    const message = res.status >= 500
      ? 'Something went wrong on our end. Please try again shortly.'
      : (data?.message || res.statusText || 'Request failed')
    throw new ApiError(message, res.status, data)
  }

  return data
}

export const http = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

// Separate from `request()` because file uploads use multipart/form-data, not
// JSON - the browser must set its own Content-Type (with the multipart
// boundary), so we can't reuse the same fixed 'application/json' header or
// JSON.stringify the body. Mirrors request()'s auth/error handling otherwise.
// Takes a pre-built FormData so callers needing extra fields alongside the
// file (e.g. delivery-proof notes/coordinates) aren't limited to a single
// bare file upload the way `uploadFile` below is.
export async function uploadFormData(path, formData) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: formData })
  } catch (networkErr) {
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 0, null)
  }

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null

  if (!res.ok) {
    if (token && res.status === 401) {
      setToken(null)
      window.dispatchEvent(new Event('auth:invalid'))
    }
    const message = res.status >= 500
      ? 'Something went wrong on our end. Please try again shortly.'
      : (data?.message || res.statusText || 'Upload failed')
    throw new ApiError(message, res.status, data)
  }

  return data
}

export function uploadFile(path, file) {
  const formData = new FormData()
  formData.append('file', file)
  return uploadFormData(path, formData)
}
