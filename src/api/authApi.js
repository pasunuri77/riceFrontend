import { http, setToken } from './client'

/** Maps to Spring Boot: POST /api/auth/login, POST /api/auth/register, POST /api/auth/logout */
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
}

export default authApi
