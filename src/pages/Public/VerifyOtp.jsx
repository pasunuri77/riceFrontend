import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Mail, ArrowRight, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import otpApi from '../../api/otp/otpApi'
import addressApi from '../../api/addressApi'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'
import OtpInput from '../../components/ui/OtpInput'

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

  const { email, purpose, formData, from } = location.state || {}
  const schema = purpose === 'reset' ? resetSchema : registerSchema

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  })

  const otp = watch('otp')

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

        // Registration itself has no address field on the backend - save the
        // address the user entered via the real (already-authenticated) address
        // API right after the account exists. Best-effort: the account is real
        // either way, and the user can always add/fix the address later.
        try {
          await addressApi.create({
            fullName: formData.fullName,
            mobile: formData.mobile,
            flat: formData.addressLine2,
            street: formData.addressLine1,
            area: formData.city,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            pincode: formData.zip,
            type: 'Home',
            isDefault: true,
          })
        } catch {
          showToast('Account created, but we could not save your address - add it from your dashboard.', 'info')
        }

        showToast('Account created successfully!', 'success')
        // A regular account only ever belongs in /dashboard/* - only honor `from`
        // if it actually points there (e.g. back to /checkout), same guard as Login.
        const fromPath = from ? `${from.pathname ?? ''}${from.search ?? ''}` : ''
        navigate(fromPath.startsWith('/dashboard') || fromPath.startsWith('/checkout') ? fromPath : '/dashboard')
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
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary-600" aria-hidden="true" />
              </div>
              <h1 className="font-display font-extrabold text-2xl">
                {purpose === 'register' ? 'Verify your email' : 'Verify OTP'}
              </h1>
              <p className="text-ink/50 text-sm mt-1.5">
                We sent a 6-digit code to<br /><span className="font-semibold text-ink">{email}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <input type="hidden" {...register('otp')} />
              <OtpInput
                length={6}
                value={otp}
                onChange={(value) => setValue('otp', value, { shouldValidate: true, shouldDirty: true })}
                error={errors.otp?.message}
                autoFocus
              />

              {purpose === 'reset' && (
                <div className="space-y-4">
                  <FormField label="New Password" error={errors.newPassword?.message}>
                    <input {...register('newPassword')} type="password" className="input-field" aria-invalid={!!errors.newPassword} />
                  </FormField>
                  <FormField label="Confirm New Password" error={errors.confirmPassword?.message}>
                    <input {...register('confirmPassword')} type="password" className="input-field" aria-invalid={!!errors.confirmPassword} />
                  </FormField>
                </div>
              )}

              <SubmitButton loading={isSubmitting}>
                {purpose === 'register' ? 'Verify Email' : 'Reset Password'} <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </SubmitButton>

              <div className="flex items-center justify-between text-xs">
                <Link to={purpose === 'register' ? '/register' : '/forgot-password'} className="flex items-center gap-1 text-ink/50 font-semibold hover:text-ink">
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Go back
                </Link>
                <button type="button" onClick={resendOtp} disabled={resending} className="text-primary-600 font-semibold hover:text-primary-700 disabled:opacity-50">
                  {resending ? 'Resending...' : 'Resend code'}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
