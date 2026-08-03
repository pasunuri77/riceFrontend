import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import otpApi from '../../api/otp/otpApi'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

export default function ForgotPassword() {
  const { showToast } = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { email: '' } })

  const onSubmit = async ({ email }) => {
    try {
      await otpApi.sendPasswordResetOtp(email)
      showToast('If the email exists, an OTP has been sent', 'success')
      navigate('/verify-otp', { state: { email, purpose: 'reset' } })
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to send OTP', 'error')
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Email Address" error={errors.email?.message}>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
              <input {...register('email')} autoFocus type="email" className="input-field pl-10" placeholder="you@example.com" aria-invalid={!!errors.email} />
            </div>
          </FormField>
          <SubmitButton loading={isSubmitting} loadingLabel="Sending OTP...">Send OTP</SubmitButton>
        </form>
        <p className="text-sm text-center text-ink/60 mt-6">
          Remembered your password? <Link to="/login" className="text-primary-600 font-semibold">Back to Login</Link>
        </p>
      </motion.div>
    </div>
  )
}
