import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import otpApi from '../../api/otp/otpApi'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'
import { INDIAN_MOBILE_REGEX, sanitizeMobileInput } from '../../utils/phone'

const schema = z
  .object({
    fullName: z.string().min(1, 'Full name is required'),
    mobile: z.string().regex(INDIAN_MOBILE_REGEX, 'Enter a valid 10-digit Indian mobile number'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function Register() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { fullName: '', mobile: '', email: '', password: '', confirmPassword: '' },
  })

  const { onChange: onMobileChange, ...mobileField } = register('mobile')

  const onSubmit = async (data) => {
    try {
      await otpApi.sendRegistrationOtp(data.email)
      showToast('OTP sent to your email', 'success')
      navigate('/verify-otp', { state: { email: data.email, purpose: 'register', formData: data, from: location.state?.from } })
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to send OTP', 'error')
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Full Name" error={errors.fullName?.message}>
            <input {...register('fullName')} autoFocus className="input-field" aria-invalid={!!errors.fullName} />
          </FormField>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Mobile Number" error={errors.mobile?.message}>
              <input
                {...mobileField}
                onChange={(e) => sanitizeMobileInput(e, onMobileChange)}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                className="input-field"
                aria-invalid={!!errors.mobile}
              />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" className="input-field" aria-invalid={!!errors.email} />
            </FormField>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Password" error={errors.password?.message}>
              <input {...register('password')} type="password" className="input-field" aria-invalid={!!errors.password} />
            </FormField>
            <FormField label="Confirm Password" error={errors.confirmPassword?.message}>
              <input {...register('confirmPassword')} type="password" className="input-field" aria-invalid={!!errors.confirmPassword} />
            </FormField>
          </div>
          <SubmitButton loading={isSubmitting} loadingLabel="Sending OTP...">Send OTP</SubmitButton>
        </form>

        <p className="text-sm text-center text-ink/60 mt-6">
          Already have an account? <Link to="/login" state={location.state} className="text-primary-600 font-semibold">Login</Link>
        </p>
      </motion.div>
    </div>
  )
}
