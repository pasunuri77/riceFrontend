import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { INDIAN_STATES } from '../../data/states'
import FormField from '../ui/FormField'
import SubmitButton from '../ui/SubmitButton'
import { INDIAN_MOBILE_REGEX, sanitizeMobileInput } from '../../utils/phone'
import deliveryApi from '../../api/deliveryApi'

// Address Details fields (and their labels/order/validation) are kept identical
// to the Address Details section on the Register page - same 6 fields, same
// requirements - so adding an address here and adding one at signup feel like
// the same form. `building`/`landmark`/`village`/`district`/`type` aren't
// collected in either place; `type` defaults to Home server-side when omitted,
// and `country` stays fixed to India (matches Register's implicit default).
const EMPTY = {
  addressFor: 'Personal', storeName: '', ownerName: '',
  fullName: '', mobile: '', altMobile: '',
  flat: '', street: '', area: '',
  city: '', state: '', country: 'India', pincode: '',
  instructions: '', isDefault: false,
}

const schema = z
  .object({
    addressFor: z.enum(['Personal', 'Business']),
    storeName: z.string().optional(),
    ownerName: z.string().optional(),
    fullName: z.string().min(1, 'Full name is required'),
    mobile: z.string().regex(INDIAN_MOBILE_REGEX, 'Enter a valid 10-digit Indian mobile number'),
    altMobile: z.union([z.string().length(0), z.string().regex(INDIAN_MOBILE_REGEX, 'Enter a valid 10-digit Indian mobile number')]).optional(),
    pincode: z.string().regex(/^\d{6}$/, 'Please enter a valid 6-digit PIN code.'),
    flat: z.string().refine((v) => v.trim().length > 0, 'House number is required'),
    street: z.string().refine((v) => v.trim().length > 0, 'Address is required'),
    area: z.string().min(1, 'Locality is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'Please select a state'),
    country: z.string(),
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
  const { onChange: onMobileChange, ...mobileField } = register('mobile')
  const { onChange: onAltMobileChange, ...altMobileField } = register('altMobile')
  const { onChange: onPincodeChange, ...pincodeField } = register('pincode')
  const pincode = watch('pincode')

  // Same digits-only, length-capped pattern as Register's PIN Code field.
  const sanitizePincodeInput = (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6)
    onPincodeChange(e)
  }

  // Informational only, never blocks saving the address - matches how this was
  // always described (a serviceability hint, not a hard gate). Debounced so a
  // real backend call only fires once the pincode is complete and settled.
  const [serviceability, setServiceability] = useState(null) // null | 'checking' | { serviceable }
  useEffect(() => {
    if (!/^\d{6}$/.test(pincode || '')) {
      setServiceability(null)
      return undefined
    }
    setServiceability('checking')
    const t = setTimeout(() => {
      deliveryApi.check(pincode)
        .then((res) => setServiceability(res))
        .catch(() => setServiceability(null))
    }, 400)
    return () => clearTimeout(t)
  }, [pincode])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <input type="hidden" {...register('country')} />
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
        <FormField label="Alternate Mobile" error={errors.altMobile?.message}>
          <input
            {...altMobileField}
            onChange={(e) => sanitizeMobileInput(e, onAltMobileChange)}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            className="input-field"
            aria-invalid={!!errors.altMobile}
          />
        </FormField>
      </div>

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
            {serviceability === 'checking' ? (
              <p className="flex items-center gap-1.5 text-xs text-ink/40 mt-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking delivery availability...</p>
            ) : serviceability?.serviceable ? (
              <p className="flex items-center gap-1.5 text-xs text-leaf-600 font-medium mt-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> We deliver to this area</p>
            ) : serviceability && !serviceability.serviceable ? (
              <p className="flex items-center gap-1.5 text-xs text-amber-600 font-medium mt-1.5"><XCircle className="w-3.5 h-3.5" /> We may not deliver here yet - you can still save this address</p>
            ) : null}
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
