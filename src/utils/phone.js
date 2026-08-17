// US phone numbers: 10 digits (area code + subscriber number), area code can't
// start with 0 or 1 per NANP rules.
export const US_MOBILE_REGEX = /^[2-9]\d{9}$/

// Strips anything non-numeric as the user types and caps length at 10, so it's
// physically impossible to type a letter/symbol or an 11th digit into the field.
export function sanitizeMobileInput(e, onChange) {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
  onChange(e)
}

// The backend stores the phone with a country code prefix (e.g. "+19834081505"),
// but every mobile-number input in the app is a bare 10-digit field (matches
// US_MOBILE_REGEX, no country code shown or editable). Populating a form
// straight from the stored value - as opposed to a value the user is actively
// typing, which sanitizeMobileInput already handles - skips that sanitizer
// entirely, so an 11+ digit value lands in the field as-is and immediately
// fails the 10-digit regex. Strip it back down to the bare number for display.
export function stripCountryCode(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}
