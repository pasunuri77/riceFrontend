import { useState } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'
import { homePathForRole } from '../../utils/roleHome'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const [show, setShow] = useState(false)
  const { user, login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { email: '', password: '' } })

  // Already signed in - nothing to do on the login form itself, send them
  // straight to their own dashboard rather than showing it again. Placed after
  // every hook call above so this early return never changes the hook order.
  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  const onSubmit = async (data) => {
    try {
      const user = await login(data)
      showToast('Welcome back!', 'success')
      // Only honor an intended destination that matches the account's own role area -
      // e.g. a user bounced from an admin page should still land on /dashboard, not /admin.
      const homePath = homePathForRole(user.role)
      const from = location.state?.from
      const fromPath = from ? `${from.pathname ?? ''}${from.search ?? ''}` : ''
      // '/checkout' is a customer-only path that isn't under '/dashboard' but
      // should still be honored as a valid bounce-back destination for a
      // regular user, same as before this was generalized to homePathForRole.
      const isValidBounceBack = fromPath.startsWith(homePath) || (homePath === '/dashboard' && fromPath.startsWith('/checkout'))
      if (fromPath && isValidBounceBack) navigate(fromPath)
      else navigate(homePath)
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Email Address" error={errors.email?.message}>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
              <input
                {...register('email')}
                autoFocus
                type="email"
                className="input-field pl-10"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
              />
            </div>
          </FormField>
          <FormField label="Password" error={errors.password?.message}>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
              <input
                {...register('password')}
                type={show ? 'text' : 'password'}
                className="input-field pl-10 pr-10"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
              />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/30">
                {show ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </FormField>
          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-xs text-primary-600 font-semibold">Forgot Password?</Link>
          </div>
          <SubmitButton loading={isSubmitting} loadingLabel="Logging in...">Login</SubmitButton>
        </form>

        {/* <p className="text-xs text-center text-ink/40 mt-3">Tip: admin@ricebazaar.com / Admin@123 to preview the Admin Dashboard.</p> */}

        <p className="text-sm text-center text-ink/60 mt-6">
          New to RiceBazaar? <Link to="/register" className="text-primary-600 font-semibold">Create an account</Link>
        </p>
      </motion.div>
    </div>
  )
}
