import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import FormField from '../ui/FormField'
import SubmitButton from '../ui/SubmitButton'
import AddressAutocomplete from './AddressAutocomplete'
import { US_MOBILE_REGEX, sanitizeMobileInput } from '../../utils/phone'
import deliveryApi from '../../api/deliveryApi'

// Address Details fields (and their labels/order/validation) are kept identical
// to the Address Details section on the Register page - Address Line 1/2, City,
// State, Country, ZIP - so adding an address here and adding one at signup feel
// like the same form.
const EMPTY = {
  addressFor: 'Personal', storeName: '', ownerName: '',
  fullName: '', mobile: '',
  addressLine1: '', addressLine2: '', city: 'Austin', state: 'Texas', country: 'United States', zip: '',
  instructions: '', isDefault: false,
}

// Saved addresses are still stored under the old India-shaped field names
// (flat/street/area/pincode) - translate them into this form's field names
// when editing, and back again on submit.
const mapAddressToForm = (a) => (a ? {
  addressFor: a.addressFor || 'Personal',
  storeName: a.storeName || '',
  ownerName: a.ownerName || '',
  fullName: a.fullName || '',
  mobile: a.mobile || '',
  addressLine1: a.street || '',
  addressLine2: a.flat || '',
  city: a.city || '',
  state: a.state || '',
  country: a.country || '',
  zip: a.pincode || '',
  instructions: a.instructions || '',
  isDefault: !!a.isDefault,
} : {})

const schema = z
  .object({
    addressFor: z.enum(['Personal', 'Business']),
    storeName: z.string().optional(),
    ownerName: z.string().optional(),
    fullName: z.string().min(1, 'Full name is required'),
    mobile: z.string().regex(US_MOBILE_REGEX, 'Enter a valid 10-digit US phone number'),
    addressLine1: z.string().refine((v) => v.trim().length > 0, 'Address is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'Please select a state'),
    country: z.string().min(1, 'Select an address to set your country'),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code.'),
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { ...EMPTY, ...mapAddressToForm(initial) },
  })

  const addressFor = watch('addressFor')
  const { onChange: onMobileChange, ...mobileField } = register('mobile')
  const { onChange: onZipChange, ...zipField } = register('zip')
  const addressLine1 = watch('addressLine1')
  const zip = watch('zip')

  // Same digits-only pattern as Register's ZIP field.
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

  // Blocks saving once we have a definitive "not serviceable" answer - but
  // never blocks on 'checking' or a failed/unknown check (null), since we
  // shouldn't punish the user for a slow or broken network call by refusing
  // to save something they typed correctly. Debounced so the real backend
  // call only fires once the ZIP is complete and settled.
  const [serviceability, setServiceability] = useState(null) // null | 'checking' | { serviceable }
  useEffect(() => {
    if (!/^\d{5}(-\d{4})?$/.test(zip || '')) {
      setServiceability(null)
      return undefined
    }
    setServiceability('checking')
    const t = setTimeout(() => {
      deliveryApi.check(zip)
        .then((res) => setServiceability(res))
        .catch(() => setServiceability(null))
    }, 400)
    return () => clearTimeout(t)
  }, [zip])

  const submitHandler = (data) => {
    const { addressLine1: street, addressLine2: flat, city, zip: pincode, ...rest } = data
    onSubmit({ ...rest, flat, street, area: city, city, pincode })
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-5" noValidate>
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
      </div>

      <div className="border-t border-black/5 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <p className="font-semibold text-sm text-ink">Address Details</p>
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
              {serviceability === 'checking' ? (
                <p className="flex items-center gap-1.5 text-xs text-ink/40 mt-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking delivery availability...</p>
              ) : serviceability?.serviceable ? (
                <p className="flex items-center gap-1.5 text-xs text-leaf-600 font-medium mt-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Great! RiceBazaar delivers to your area.</p>
              ) : serviceability && !serviceability.serviceable ? (
                <p className="flex items-center gap-1.5 text-xs text-red-500 font-medium mt-1.5"><XCircle className="w-3.5 h-3.5" /> Sorry, RiceBazaar currently does not deliver to this location. We currently deliver to selected areas of Austin, Texas.</p>
              ) : (
                <p className="text-xs text-ink/40 mt-1.5">RiceBazaar currently delivers within selected areas of Austin, Texas.</p>
              )}
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
        <SubmitButton loading={isSubmitting} disabled={serviceability?.serviceable === false} className="btn-primary flex-1">{submitLabel}</SubmitButton>
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost border border-black/10">Cancel</button>}
      </div>
    </form>
  )
}
