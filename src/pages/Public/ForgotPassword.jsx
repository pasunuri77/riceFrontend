import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  const submit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-primary-50 via-cream to-leaf-50">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-md p-8">
        {!sent ? (
          <>
            <div className="text-center mb-7">
              <span className="text-3xl">🔑</span>
              <h1 className="font-display font-extrabold text-2xl mt-2">Forgot Password</h1>
              <p className="text-ink/50 text-sm mt-1">Enter your email to receive a reset link</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label-field">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" />
                </div>
              </div>
              <button className="btn-primary w-full">Send Reset Link</button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle2 className="w-14 h-14 text-leaf-500 mx-auto mb-3" />
            <h2 className="font-bold text-lg">Check Your Email</h2>
            <p className="text-sm text-ink/50 mt-1">We've sent a password reset link to <span className="font-semibold text-ink">{email}</span></p>
          </div>
        )}
        <p className="text-sm text-center text-ink/60 mt-6">
          Remembered your password? <Link to="/login" className="text-primary-600 font-semibold">Back to Login</Link>
        </p>
      </motion.div>
    </div>
  )
}
