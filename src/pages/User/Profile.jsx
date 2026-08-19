import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PageHeader from '../../components/ui/PageHeader'
import FormField from '../../components/ui/FormField'
import Breadcrumb from '../../components/ui/Breadcrumb'
import SubmitButton from '../../components/ui/SubmitButton'
import AddressAutocomplete from '../../components/forms/AddressAutocomplete'
import ProfilePhotoCard from '../../components/ui/ProfilePhotoCard'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useNotifications } from '../../context/NotificationContext'
import { ApiError } from '../../api/client'
import { US_MOBILE_REGEX, sanitizeMobileInput, stripCountryCode } from '../../utils/phone'

// Address Details fields here are kept identical to Register's Address Details
// section (same fields, same labels/hints/validation) - Profile just edits
// the same underlying saved address in place, right after Mobile Number,
// instead of a separate "Manage Addresses" detour.
const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  mobile: z.string().regex(US_MOBILE_REGEX, 'Enter a valid 10-digit mobile number'),
  addressLine1: z.string().refine((v) => v.trim().length > 0, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'Please select a state'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code.'),
  country: z.string().min(1, 'Select an address to set your country'),
})

export default function Profile() {
  const { user, addresses, updateProfile, addAddress, updateAddress, uploadPhoto, removePhoto } = useAuth()
  const { showToast } = useToast()
  const { notify } = useNotifications()
  const [savingAddress, setSavingAddress] = useState(false)

  const primaryAddress = addresses?.find((a) => a.isDefault) || addresses?.[0] || null

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { fullName: '', email: '', mobile: '', addressLine1: '', addressLine2: '', city: 'Austin', state: 'Texas', zip: '', country: 'United States' },
  })

  useEffect(() => {
    reset({
      fullName: user?.name || '',
      email: user?.email || '',
      mobile: stripCountryCode(user?.phone),
      addressLine1: primaryAddress?.street || '',
      addressLine2: primaryAddress?.flat || '',
      city: primaryAddress?.city || 'Austin',
      state: primaryAddress?.state || 'Texas',
      zip: primaryAddress?.pincode || '',
      country: primaryAddress?.country || 'United States',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, primaryAddress?.id, reset])

  const { onChange: onMobileChange, ...mobileField } = register('mobile')
  const { onChange: onZipChange, ...zipField } = register('zip')
  const fullName = watch('fullName')
  const addressLine1 = watch('addressLine1')

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

  const save = async (data) => {
    try {
      await updateProfile({ fullName: data.fullName, email: data.email, mobile: data.mobile })

      setSavingAddress(true)
      const addressPayload = {
        fullName: data.fullName, mobile: data.mobile,
        pincode: data.zip, flat: data.addressLine2, street: data.addressLine1, area: data.city,
        city: data.city, state: data.state, country: data.country, isDefault: true,
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

      <div className="max-w-lg">
        <ProfilePhotoCard
          name={fullName}
          roleLabel="User Account"
          photoUrl={user?.photoUrl}
          onUpload={uploadPhoto}
          onRemove={removePhoto}
        />
      </div>

      <div className="card p-6 max-w-lg mt-6">
        <form onSubmit={handleSubmit(save)} className="space-y-4" noValidate>
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
            <div className="flex items-center gap-2 mb-3">
              <p className="font-semibold text-sm text-ink">Address</p>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">Google Maps</span>
            </div>
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

          <SubmitButton loading={isSubmitting || savingAddress} className="btn-primary">Save Changes</SubmitButton>
        </form>
      </div>
    </div>
  )
}
