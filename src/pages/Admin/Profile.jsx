import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'
import ProfilePhotoCard from '../../components/ui/ProfilePhotoCard'
import { ApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { INDIAN_MOBILE_REGEX, sanitizeMobileInput, stripCountryCode } from '../../utils/phone'

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  mobile: z.string().regex(INDIAN_MOBILE_REGEX, 'Enter a valid 10-digit Indian mobile number'),
})

export default function AdminProfile() {
  const { user, updateAdminProfile, uploadAdminPhoto, removeAdminPhoto } = useAuth()
  const { showToast } = useToast()

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: savingProfile },
  } = useForm({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: { fullName: '', email: '', mobile: '' },
  })

  const { onChange: onMobileChange, ...mobileField } = registerProfile('mobile')

  useEffect(() => {
    resetProfile({
      fullName: user?.name || '',
      email: user?.email || '',
      mobile: stripCountryCode(user?.phone),
    })
  }, [user, resetProfile])

  const saveProfile = async (data) => {
    try {
      await updateAdminProfile(data)
      showToast('Admin profile updated', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update admin profile', 'error')
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Profile' }]} />
      <PageHeader title="Profile" subtitle="Your account details" />

      <div className="max-w-2xl mx-auto space-y-6">
        <ProfilePhotoCard
          name={user?.name}
          roleLabel="Admin Account"
          photoUrl={user?.photoUrl}
          onUpload={uploadAdminPhoto}
          onRemove={removeAdminPhoto}
        />

        <div className="card p-6">
          <h3 className="font-bold text-lg font-display mb-4">Admin Profile</h3>
          <form onSubmit={handleProfileSubmit(saveProfile)} className="space-y-4" noValidate>
            <FormField label="Full Name" error={profileErrors.fullName?.message}>
              <input {...registerProfile('fullName')} autoFocus className="input-field" aria-invalid={!!profileErrors.fullName} />
            </FormField>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Email" error={profileErrors.email?.message}>
                <input {...registerProfile('email')} type="email" className="input-field" aria-invalid={!!profileErrors.email} />
              </FormField>
              <FormField label="Mobile Number" error={profileErrors.mobile?.message}>
                <input
                  {...mobileField}
                  onChange={(e) => sanitizeMobileInput(e, onMobileChange)}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="input-field"
                  aria-invalid={!!profileErrors.mobile}
                />
              </FormField>
            </div>
            <SubmitButton loading={savingProfile} className="btn-primary">Save Profile</SubmitButton>
          </form>
        </div>
      </div>
    </div>
  )
}
