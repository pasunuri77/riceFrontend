import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'

const EMPTY = {
  fullName: '', mobile: '', email: '', password: '', confirmPassword: '',
}

export default function Register() {
  const [form, setForm] = useState(EMPTY)
  const { register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      showToast('Enter a valid 10-digit Indian mobile number', 'error')
      return
    }
    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    try {
      await register(form)
      showToast('Account created successfully!', 'success')
      navigate('/dashboard')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Registration failed', 'error')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-primary-50 via-cream to-leaf-50">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <span className="text-3xl">🌾</span>
          <h1 className="font-display font-extrabold text-2xl mt-2">Create Your Account</h1>
          <p className="text-ink/50 text-sm mt-1">Join RiceBazaar and start ordering</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div><label className="label-field">Full Name</label><input required className="input-field" value={form.fullName} onChange={update('fullName')} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Mobile Number</label>
              <input required pattern="[6-9][0-9]{9}" maxLength={10} title="Enter a valid 10-digit Indian mobile number" placeholder="98765 43210" className="input-field" value={form.mobile} onChange={(e) => update('mobile')({ target: { value: e.target.value.replace(/\D/g, '').slice(0, 10) } })} />
            </div>
            <div><label className="label-field">Email</label><input required type="email" className="input-field" value={form.email} onChange={update('email')} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label-field">Password</label><input required type="password" className="input-field" value={form.password} onChange={update('password')} /></div>
            <div><label className="label-field">Confirm Password</label><input required type="password" className="input-field" value={form.confirmPassword} onChange={update('confirmPassword')} /></div>
          </div>
          <button className="btn-primary w-full">Create Account</button>
        </form>

        <p className="text-sm text-center text-ink/60 mt-6">
          Already have an account? <Link to="/login" className="text-primary-600 font-semibold">Login</Link>
        </p>
      </motion.div>
    </div>
  )
}
