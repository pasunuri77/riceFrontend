import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { CheckCircle2, KeyRound, XCircle } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { ApiError } from '../../api/client'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

// Lands here from the invite email (staff or admin-created customer) - a
// 24h password-reset-token link, distinct from the OTP-based forgot-password
// flow used elsewhere (ForgotPassword.jsx / VerifyOtp.jsx).
export default function SetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { setPassword } = useAuth()
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { password: '', confirmPassword: '' } })

  const onSubmit = async (data) => {
    try {
      const user = await setPassword({ token, password: data.password })
      setDone(true)
      // Auto-signed-in via the emailed link itself (already proved identity) -
      // send them straight into their own dashboard after a beat, rather than
      // making them turn around and log in manually with the password they
      // just set.
      setTimeout(() => {
        navigate(user.role === 'admin' || user.role === 'employee' ? '/admin' : '/dashboard', { replace: true })
      }, 1500)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to set password. The link may have expired.', 'error')
    }
  }

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-primary-50 via-cream to-leaf-50">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-md p-8 text-center">
          <XCircle className="w-14 h-14 text-red-500 mx-auto mb-3" />
          <h1 className="font-bold text-lg">Invalid Link</h1>
          <p className="text-sm text-ink/50 mt-1">This password setup link is missing or malformed. Ask whoever invited you to resend the invitation.</p>
          <Link to="/login" className="btn-primary w-full mt-6 inline-flex justify-center">Back to Login</Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-primary-50 via-cream to-leaf-50">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-md p-8">
        {done ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-14 h-14 text-leaf-500 mx-auto mb-3" />
            <h2 className="font-bold text-lg">Password Set</h2>
            <p className="text-sm text-ink/50 mt-1">Your account is ready. Taking you to your dashboard...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-7">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-6 h-6 text-primary-600" aria-hidden="true" />
              </div>
              <h1 className="font-display font-extrabold text-2xl">Set Up Your Password</h1>
              <p className="text-ink/50 text-sm mt-1.5">Choose a password to activate your RiceBazaar account.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField label="New Password" error={errors.password?.message}>
                <input {...register('password')} autoFocus type="password" className="input-field" aria-invalid={!!errors.password} />
              </FormField>
              <FormField label="Confirm Password" error={errors.confirmPassword?.message}>
                <input {...register('confirmPassword')} type="password" className="input-field" aria-invalid={!!errors.confirmPassword} />
              </FormField>
              <SubmitButton loading={isSubmitting} loadingLabel="Setting password...">Set Password</SubmitButton>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
