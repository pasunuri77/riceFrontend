import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { INDIAN_STATES } from '../../data/states'
import FormField from '../ui/FormField'
import SubmitButton from '../ui/SubmitButton'

const TYPES = ['Home', 'Office', 'Shop', 'Warehouse', 'Other']

const EMPTY = {
  addressFor: 'Personal', storeName: '', ownerName: '',
  fullName: '', mobile: '', altMobile: '',
  flat: '', building: '', street: '', area: '', landmark: '', village: '',
  city: '', district: '', state: '', country: 'India', pincode: '',
  type: 'Home', instructions: '', isDefault: false,
}

const schema = z
  .object({
    addressFor: z.enum(['Personal', 'Business']),
    storeName: z.string().optional(),
    ownerName: z.string().optional(),
    fullName: z.string().min(1, 'Full name is required'),
    mobile: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
    altMobile: z.string().optional(),
    flat: z.string().min(1, 'Flat / Door No. is required'),
    building: z.string().optional(),
    street: z.string().min(1, 'Street is required'),
    area: z.string().min(1, 'Area is required'),
    landmark: z.string().optional(),
    village: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    district: z.string().min(1, 'District is required'),
    state: z.string().min(1, 'Please select a state'),
    country: z.string(),
    pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
    type: z.string(),
    instructions: z.string().optional(),
    isDefault: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.addressFor === 'Business') {
      if (!data.storeName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['storeName'], message: 'Store name is required' })
      if (!data.ownerName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ownerName'], message: 'Owner name is required' })
    }
  })

export default function AddressForm({ initial, onSubmit, onCancel, submitLabel = 'Save Address' }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { ...EMPTY, ...initial },
  })

  const addressFor = watch('addressFor')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <p className="label-field mb-2">Is this address for personal use or a business?</p>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="radio" value="Business" {...register('addressFor')} className="accent-primary-500 w-4 h-4" />
            Business
          </label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="radio" value="Personal" {...register('addressFor')} className="accent-primary-500 w-4 h-4" />
            Personal
          </label>
        </div>
      </div>

      {addressFor === 'Business' && (
        <div className="grid sm:grid-cols-2 gap-4 border-t border-black/5 pt-5">
          <FormField label="Store Name" error={errors.storeName?.message}>
            <input {...register('storeName')} className="input-field" aria-invalid={!!errors.storeName} />
          </FormField>
          <FormField label="Owner Name" error={errors.ownerName?.message}>
            <input {...register('ownerName')} className="input-field" aria-invalid={!!errors.ownerName} />
          </FormField>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 border-t border-black/5 pt-5">
        <FormField label="Full Name" error={errors.fullName?.message}>
          <input {...register('fullName')} autoFocus className="input-field" aria-invalid={!!errors.fullName} />
        </FormField>
        <FormField label="Mobile Number" error={errors.mobile?.message}>
          <input {...register('mobile')} inputMode="numeric" maxLength={10} className="input-field" aria-invalid={!!errors.mobile} />
        </FormField>
        <FormField label="Alternate Mobile">
          <input {...register('altMobile')} className="input-field" />
        </FormField>
      </div>

      <div className="border-t border-black/5 pt-5">
        <p className="font-semibold text-sm text-ink mb-3">Address Details</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Flat / Door No." error={errors.flat?.message}>
            <input {...register('flat')} className="input-field" aria-invalid={!!errors.flat} />
          </FormField>
          <FormField label="Building Name">
            <input {...register('building')} className="input-field" />
          </FormField>
          <FormField label="Street" error={errors.street?.message}>
            <input {...register('street')} className="input-field" aria-invalid={!!errors.street} />
          </FormField>
          <FormField label="Area" error={errors.area?.message}>
            <input {...register('area')} className="input-field" aria-invalid={!!errors.area} />
          </FormField>
          <FormField label="Landmark">
            <input {...register('landmark')} className="input-field" />
          </FormField>
          <FormField label="Village (Optional)">
            <input {...register('village')} className="input-field" />
          </FormField>
          <FormField label="City" error={errors.city?.message}>
            <input {...register('city')} className="input-field" aria-invalid={!!errors.city} />
          </FormField>
          <FormField label="District" error={errors.district?.message}>
            <input {...register('district')} className="input-field" aria-invalid={!!errors.district} />
          </FormField>
          <FormField label="State" error={errors.state?.message}>
            <select {...register('state')} className="input-field" aria-invalid={!!errors.state}>
              <option value="">Select State</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Country">
            <input {...register('country')} className="input-field" disabled />
          </FormField>
          <FormField label="Pincode" error={errors.pincode?.message}>
            <input {...register('pincode')} inputMode="numeric" maxLength={6} className="input-field" aria-invalid={!!errors.pincode} />
          </FormField>
          <FormField label="Address Type">
            <select {...register('type')} className="input-field">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
        </div>
      </div>

      <FormField label="Delivery Instructions (Optional)">
        <textarea {...register('instructions')} rows={2} className="input-field" placeholder="e.g. Ring the bell twice" />
      </FormField>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" {...register('isDefault')} className="accent-primary-500 w-4 h-4" />
        Make this my default address
      </label>

      <div className="flex gap-3 pt-2">
        <SubmitButton loading={isSubmitting} className="btn-primary flex-1">{submitLabel}</SubmitButton>
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost border border-black/10">Cancel</button>}
      </div>
    </form>
  )
}
