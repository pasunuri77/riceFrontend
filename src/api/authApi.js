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
}

export default authApi
