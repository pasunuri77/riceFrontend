import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PageHeader from '../../components/ui/PageHeader'
import FormField from '../../components/ui/FormField'
import Breadcrumb from '../../components/ui/Breadcrumb'
import SubmitButton from '../../components/ui/SubmitButton'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
})

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { fullName: '', email: '', mobile: '' },
  })

  useEffect(() => {
    reset({
      fullName: user?.name || '',
      email: user?.email || '',
      mobile: user?.phone || '',
    })
  }, [user, reset])

  const { onChange: onMobileChange, ...mobileField } = register('mobile')
  const fullName = watch('fullName')

  const save = async (data) => {
    try {
      await updateProfile(data)
      showToast('Profile updated', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update profile', 'error')
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
              onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); onMobileChange(e) }}
              inputMode="numeric"
              maxLength={10}
              className="input-field"
              aria-invalid={!!errors.mobile}
            />
          </FormField>
          <SubmitButton loading={isSubmitting} className="btn-primary">Save Changes</SubmitButton>
        </form>
      </div>
    </div>
  )
}
