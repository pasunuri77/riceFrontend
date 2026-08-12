import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PageHeader from '../../components/ui/PageHeader'
import FormField from '../../components/ui/FormField'
import Breadcrumb from '../../components/ui/Breadcrumb'
import SubmitButton from '../../components/ui/SubmitButton'
import { INDIAN_STATES } from '../../data/states'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useNotifications } from '../../context/NotificationContext'
import { ApiError } from '../../api/client'
import { INDIAN_MOBILE_REGEX, sanitizeMobileInput } from '../../utils/phone'

// Address Details fields here are kept identical to Register's Address Details
// section (same 6 fields, same labels/hints/validation) - Profile just edits
// the same underlying saved address in place, right after Mobile Number,
// instead of a separate "Manage Addresses" detour.
const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  mobile: z.string().regex(INDIAN_MOBILE_REGEX, 'Enter a valid 10-digit Indian mobile number'),
  pincode: z.string().regex(/^\d{6}$/, 'Please enter a valid 6-digit PIN code.'),
  flat: z.string().refine((v) => v.trim().length > 0, 'House number is required'),
  street: z.string().refine((v) => v.trim().length > 0, 'Address is required'),
  area: z.string().min(1, 'Locality is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'Please select a state'),
})

export default function Profile() {
  const { user, addresses, updateProfile, addAddress, updateAddress } = useAuth()
  const { showToast } = useToast()
  const { notify } = useNotifications()
  const [savingAddress, setSavingAddress] = useState(false)

  const primaryAddress = addresses?.find((a) => a.isDefault) || addresses?.[0] || null

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { fullName: '', email: '', mobile: '', pincode: '', flat: '', street: '', area: '', city: '', state: '' },
  })

  useEffect(() => {
    reset({
      fullName: user?.name || '',
      email: user?.email || '',
      mobile: user?.phone || '',
      pincode: primaryAddress?.pincode || '',
      flat: primaryAddress?.flat || '',
      street: primaryAddress?.street || '',
      area: primaryAddress?.area || '',
      city: primaryAddress?.city || '',
      state: primaryAddress?.state || '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, primaryAddress?.id, reset])

  const { onChange: onMobileChange, ...mobileField } = register('mobile')
  const { onChange: onPincodeChange, ...pincodeField } = register('pincode')
  const fullName = watch('fullName')

  const sanitizePincodeInput = (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6)
    onPincodeChange(e)
  }

  const save = async (data) => {
    try {
      await updateProfile({ fullName: data.fullName, email: data.email, mobile: data.mobile })

      setSavingAddress(true)
      const addressPayload = {
        fullName: data.fullName, mobile: data.mobile,
        pincode: data.pincode, flat: data.flat, street: data.street, area: data.area,
        city: data.city, state: data.state, country: 'India', isDefault: true,
      }
      if (primaryAddress) await updateAddress(primaryAddress.id, addressPayload)
      else await addAddress(addressPayload)

      showToast('Profile updated', 'success')
      notify('PROFILE_UPDATED', {})
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update profile', 'error')
    } finally {
      setSavingAddress(false)
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Profile' }]} />
      <PageHeader title="My Profile" subtitle="Manage your personal information" />

      <div className="card p-6 max-w-lg">
        <form onSubmit={handleSubmit(save)} className="space-y-4" noValidate>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-bold uppercase">{fullName?.[0] || 'U'}</div>
            <div>
              <p className="font-bold">{fullName}</p>
              <p className="text-xs text-ink/40">User Account</p>
            </div>
          </div>
          <FormField label="Full Name" error={errors.fullName?.message}>
            <input {...register('fullName')} autoFocus className="input-field" aria-invalid={!!errors.fullName} />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" className="input-field" aria-invalid={!!errors.email} />
          </FormField>
          <FormField label="Mobile Number" error={errors.mobile?.message}>
            <input
              {...mobileField}
              onChange={(e) => sanitizeMobileInput(e, onMobileChange)}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className="input-field"
              aria-invalid={!!errors.mobile}
            />
          </FormField>

          <div className="border-t border-black/5 pt-5">
            <p className="font-semibold text-sm text-ink mb-3">Address Details</p>
            <div className="space-y-4">
              <FormField label="PIN Code" error={errors.pincode?.message}>
                <input
                  {...pincodeField}
                  onChange={sanitizePincodeInput}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN code"
                  className="input-field"
                  aria-invalid={!!errors.pincode}
                />
              </FormField>
              <FormField label="House Number / Tower / Block" error={errors.flat?.message} hint="House number helps with doorstep delivery">
                <input {...register('flat')} placeholder="Enter house number, tower or block" className="input-field" aria-invalid={!!errors.flat} />
              </FormField>
              <FormField label="Address (Locality, Building, Street)" error={errors.street?.message} hint="Please enter your society/apartment/building details">
                <input {...register('street')} placeholder="Enter locality, building name, street" className="input-field" aria-invalid={!!errors.street} />
              </FormField>
              <FormField label="Locality / Town" error={errors.area?.message}>
                <input {...register('area')} placeholder="Enter locality or town" className="input-field" aria-invalid={!!errors.area} />
              </FormField>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="City / District" error={errors.city?.message}>
                  <input {...register('city')} placeholder="Enter city or district" className="input-field" aria-invalid={!!errors.city} />
                </FormField>
                <FormField label="State" error={errors.state?.message}>
                  <select {...register('state')} className="input-field" aria-invalid={!!errors.state}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
              </div>
            </div>
          </div>

          <SubmitButton loading={isSubmitting || savingAddress} className="btn-primary">Save Changes</SubmitButton>
        </form>
      </div>
    </div>
  )
}
