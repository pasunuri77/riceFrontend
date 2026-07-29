import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import otpApi from '../../api/otp/otpApi'

export default function VerifyOtp() {
  const location = useLocation()
  const navigate = useNavigate()
  const { register } = useAuth()
  const { showToast } = useToast()

  const { email, purpose, formData } = location.state || {}

  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [done, setDone] = useState(false)

  if (!email || !purpose) {
    return <Navigate to="/register" replace />
  }

  const resendOtp = async () => {
    setResending(true)
    try {
      if (purpose === 'register') await otpApi.sendRegistrationOtp(email)
      else await otpApi.sendPasswordResetOtp(email)
      showToast('OTP resent to your email', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to resend OTP', 'error')
    } finally {
      setResending(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (purpose === 'reset' && newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    setSubmitting(true)
    try {
      if (purpose === 'register') {
        await otpApi.verifyRegistrationOtp(email, otp)
        await register(formData)
        showToast('Account created successfully!', 'success')
        navigate('/dashboard')
      } else {
        await otpApi.resetPassword(email, otp, newPassword)
        setDone(true)
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Verification failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-primary-50 via-cream to-leaf-50">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-md p-8">
        {done ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-14 h-14 text-leaf-500 mx-auto mb-3" />
            <h2 className="font-bold text-lg">Password Reset</h2>
            <p className="text-sm text-ink/50 mt-1">Your password has been reset successfully. You can now log in with your new password.</p>
            <Link to="/login" className="btn-primary w-full mt-6 inline-flex">Back to Login</Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-7">
              <span className="text-3xl">🔐</span>
              <h1 className="font-display font-extrabold text-2xl mt-2">Verify OTP</h1>
              <p className="text-ink/50 text-sm mt-1">Enter the 6-digit code sent to <span className="font-semibold text-ink">{email}</span></p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label-field">Enter OTP</label>
                <input required pattern="\d{6}" maxLength={6} placeholder="6-digit code" className="input-field tracking-widest text-center" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
              </div>

              {purpose === 'reset' && (
                <>
                  <div>
                    <label className="label-field">New Password</label>
                    <input required type="password" minLength={8} className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field">Confirm New Password</label>
                    <input required type="password" minLength={8} className="input-field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </>
              )}

              <button className="btn-primary w-full" disabled={submitting}>
                {submitting ? 'Please wait...' : purpose === 'register' ? 'Register' : 'Reset Password'}
              </button>

              <div className="flex justify-between text-xs">
                <Link to={purpose === 'register' ? '/register' : '/forgot-password'} className="text-ink/50 font-semibold">Change {purpose === 'register' ? 'details' : 'email'}</Link>
                <button type="button" onClick={resendOtp} disabled={resending} className="text-primary-600 font-semibold">{resending ? 'Resending...' : 'Resend OTP'}</button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
