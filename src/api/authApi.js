import { http, setToken, uploadFile } from './client'

/** Maps to Spring Boot: POST /api/auth/login, POST /api/auth/register, POST /api/auth/logout, PATCH /api/users/me, PATCH /api/admin/profile */
const authApi = {
  login: async (credentials) => {
    const { token, user } = await http.post('/api/auth/login', credentials)
    setToken(token)
    return user
  },

  register: async (data) => {
    const { token, user } = await http.post('/api/auth/register', {
      fullName: data.fullName,
      mobile: data.mobile,
      email: data.email,
      password: data.password,
    })
    setToken(token)
    return user
  },

  logout: async () => {
    try {
      await http.post('/api/auth/logout')
    } catch {
      // ignore network/server failures - the client-side session is cleared regardless
    } finally {
      setToken(null)
    }
  },

  updateProfile: (data) => http.patch('/api/users/me', {
    fullName: data.fullName,
    email: data.email,
    mobile: data.mobile,
  }),

  updateAdminProfile: (data) => http.patch('/api/admin/profile', {
    fullName: data.fullName,
    email: data.email,
    mobile: data.mobile,
  }),

  uploadPhoto: (file) => uploadFile('/api/users/me/photo', file),
  removePhoto: () => http.delete('/api/users/me/photo'),

  uploadAdminPhoto: (file) => uploadFile('/api/admin/profile/photo', file),
  removeAdminPhoto: () => http.delete('/api/admin/profile/photo'),

  // Consumes the invite/password-reset-token link an invited admin/employee
  // (or admin-created customer) receives by email - distinct from the
  // OTP-based forgot-password flow (otpApi.resetPassword). Same response
  // shape as login/register ({ token, user }) so the caller can be signed
  // straight in and routed to their own dashboard, rather than bounced back
  // to a manual login after already having just proven their identity via
  // the emailed link.
  setPassword: async ({ token, password }) => {
    const { token: authToken, user } = await http.post('/api/auth/set-password', { token, password })
    setToken(authToken)
    return user
  },
}

export default authApi
