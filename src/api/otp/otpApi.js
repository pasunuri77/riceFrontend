import { http } from '../client'

/** Maps to Spring Boot: POST /api/auth/send-otp, /verify-otp, /forgot-password, /reset-password */
const otpApi = {
  sendRegistrationOtp: (email) => http.post('/api/auth/send-otp', { email }),

  verifyRegistrationOtp: (email, otp) => http.post('/api/auth/verify-otp', { email, otp }),

  sendPasswordResetOtp: (email) => http.post('/api/auth/forgot-password', { email }),

  resetPassword: (email, otp, newPassword) =>
    http.post('/api/auth/reset-password', { email, otp, newPassword }),
}

export default otpApi
