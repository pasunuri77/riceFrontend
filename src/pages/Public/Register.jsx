import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { ApiError } from '../../api/client'
import otpApi from '../../api/otpApi'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'
import AddressAutocomplete from '../../components/forms/AddressAutocomplete'
import { US_MOBILE_REGEX, sanitizeMobileInput } from '../../utils/phone'
import { homePathForRole } from '../../utils/roleHome'

const schema = z
  .object({
    fullName: z.string().min(1, 'Full name is required'),
    mobile: z.string().regex(US_MOBILE_REGEX, 'Enter a valid 10-digit mobile number'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    // Address fields - collected here so a new account isn't left with zero saved
    // addresses, but saved via the real /api/addresses endpoint after the account
    // exists (registration itself has no address field on the backend).
    addressLine1: z.string().refine((v) => v.trim().length > 0, 'Address is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'Please select a state'),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code.'),
    country: z.string().min(1, 'Select an address to set your country'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function Register() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '', mobile: '', email: '', password: '', confirmPassword: '',
      addressLine1: '', addressLine2: '', city: 'Austin', state: 'Texas', zip: '', country: 'United States',
    },
  })

  const { onChange: onMobileChange, ...mobileField } = register('mobile')
  const { onChange: onZipChange, ...zipField } = register('zip')
  const addressLine1 = watch('addressLine1')

  // Already signed in - registration is for creating a new account, not
  // relevant to someone already logged in. Placed after every hook call
  // above so this early return never changes the hook order.
  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  // Same digits-only, length-capped pattern as the mobile field - ZIP stays a
  // string throughout (never parsed as a number) so a leading zero can't be lost.
  const sanitizeZipInput = (e) => {
    e.target.value = e.target.value.replace(/[^\d-]/g, '').slice(0, 10)
    onZipChange(e)
  }

  const handlePlaceSelect = (parsed) => {
    setValue('addressLine1', parsed.line1, { shouldValidate: true, shouldDirty: true })
    if (parsed.city) setValue('city', parsed.city, { shouldValidate: true, shouldDirty: true })
    if (parsed.state) setValue('state', parsed.state, { shouldValidate: true, shouldDirty: true })
    if (parsed.zip) setValue('zip', parsed.zip, { shouldValidate: true, shouldDirty: true })
    if (parsed.country) setValue('country', parsed.country, { shouldValidate: true, shouldDirty: true })
  }

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
                placeholder="10-digit mobile number"
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

          <div className="border-t border-black/5 pt-4">
            <p className="font-semibold text-sm text-ink mb-3">Address Details</p>
            <div className="space-y-4">
              <FormField label="Address Line 1" error={errors.addressLine1?.message} hint="Start typing to search your address">
                <AddressAutocomplete
                  value={addressLine1}
                  onChange={(e) => setValue('addressLine1', e.target.value, { shouldValidate: true, shouldDirty: true })}
                  onPlaceSelect={handlePlaceSelect}
                  placeholder="Enter street address"
                  className="input-field"
                  aria-invalid={!!errors.addressLine1}
                />
              </FormField>
              <FormField label="Address Line 2 (optional)" error={errors.addressLine2?.message}>
                <input {...register('addressLine2')} placeholder="Apt, suite, floor, unit" className="input-field" />
              </FormField>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="City" error={errors.city?.message}>
                  <input {...register('city')} placeholder="Enter city" className="input-field" aria-invalid={!!errors.city} />
                </FormField>
                <FormField label="State" error={errors.state?.message}>
                  <input {...register('state')} className="input-field" aria-invalid={!!errors.state} />
                </FormField>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Country" error={errors.country?.message}>
                  <input {...register('country')} className="input-field" aria-invalid={!!errors.country} />
                </FormField>
                <FormField label="ZIP Code" error={errors.zip?.message}>
                  <input
                    {...zipField}
                    onChange={sanitizeZipInput}
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter ZIP code"
                    className="input-field"
                    aria-invalid={!!errors.zip}
                  />
                </FormField>
              </div>
            </div>
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
