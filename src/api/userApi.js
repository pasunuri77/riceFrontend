import { http } from './client'

/** Maps to Spring Boot: PATCH /api/users/me */
const userApi = {
  updateProfile: (data) => http.patch('/api/users/me', {
    fullName: data.name,
    email: data.email,
    mobile: data.phone,
  }),
}

export default userApi
