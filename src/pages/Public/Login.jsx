import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try {
      const user = await login({ email, password })
      showToast('Welcome back!', 'success')
      navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Login failed', 'error')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-primary-50 via-cream to-leaf-50">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-md p-8">
        <div className="text-center mb-7">
          <span className="text-3xl">🌾</span>
          <h1 className="font-display font-extrabold text-2xl mt-2">Welcome Back</h1>
          <p className="text-ink/50 text-sm mt-1">Login to continue to RiceBazaar</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label-field">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="label-field">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
              <input required type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-10 pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/30">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-primary-600 font-semibold">Forgot Password?</Link>
          </div>
          <button className="btn-primary w-full">Login</button>
        </form>

        <p className="text-xs text-center text-ink/40 mt-3">Tip: admin@ricebazaar.in / Admin@123 to preview the Admin Dashboard.</p>

        <p className="text-sm text-center text-ink/60 mt-6">
          New to RiceBazaar? <Link to="/register" className="text-primary-600 font-semibold">Create an account</Link>
        </p>
      </motion.div>
    </div>
  )
}
