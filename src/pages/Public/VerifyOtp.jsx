import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import otpApi from '../../api/otp/otpApi'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'

const otpSchema = { otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') }

const registerSchema = z.object(otpSchema)

const resetSchema = z
  .object({
    ...otpSchema,
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export default function VerifyOtp() {
  const location = useLocation()
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const { showToast } = useToast()
  const [resending, setResending] = useState(false)
  const [done, setDone] = useState(false)

  const { email, purpose, formData } = location.state || {}
  const schema = purpose === 'reset' ? resetSchema : registerSchema

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  })

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

  const onSubmit = async (data) => {
    try {
      if (purpose === 'register') {
        await otpApi.verifyRegistrationOtp(email, data.otp)
        await registerUser(formData)
        showToast('Account created successfully!', 'success')
        navigate('/dashboard')
      } else {
        await otpApi.resetPassword(email, data.otp, data.newPassword)
        setDone(true)
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Verification failed', 'error')
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField label="Enter OTP" error={errors.otp?.message}>
                <input
                  {...register('otp')}
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  className="input-field tracking-widest text-center"
                  aria-invalid={!!errors.otp}
                />
              </FormField>

              {purpose === 'reset' && (
                <>
                  <FormField label="New Password" error={errors.newPassword?.message}>
                    <input {...register('newPassword')} type="password" className="input-field" aria-invalid={!!errors.newPassword} />
                  </FormField>
                  <FormField label="Confirm New Password" error={errors.confirmPassword?.message}>
                    <input {...register('confirmPassword')} type="password" className="input-field" aria-invalid={!!errors.confirmPassword} />
                  </FormField>
                </>
              )}

              <SubmitButton loading={isSubmitting}>
                {purpose === 'register' ? 'Register' : 'Reset Password'}
              </SubmitButton>

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
