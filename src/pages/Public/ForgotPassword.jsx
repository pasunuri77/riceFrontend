import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import otpApi from '../../api/otp/otpApi'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const { showToast } = useToast()
  const navigate = useNavigate()

  const sendOtp = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await otpApi.sendPasswordResetOtp(email)
      showToast('If the email exists, an OTP has been sent', 'success')
      navigate('/verify-otp', { state: { email, purpose: 'reset' } })
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to send OTP', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-primary-50 via-cream to-leaf-50">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-md p-8">
        <div className="text-center mb-7">
          <span className="text-3xl">🔑</span>
          <h1 className="font-display font-extrabold text-2xl mt-2">Forgot Password</h1>
          <p className="text-ink/50 text-sm mt-1">Enter your email to receive a reset OTP</p>
        </div>
        <form onSubmit={sendOtp} className="space-y-4">
          <div>
            <label className="label-field">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" />
            </div>
          </div>
          <button className="btn-primary w-full" disabled={sending}>{sending ? 'Sending OTP...' : 'Send OTP'}</button>
        </form>
        <p className="text-sm text-center text-ink/60 mt-6">
          Remembered your password? <Link to="/login" className="text-primary-600 font-semibold">Back to Login</Link>
        </p>
      </motion.div>
    </div>
  )
}
