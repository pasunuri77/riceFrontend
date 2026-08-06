// Indian mobile numbers: 10 digits, first digit 6-9.
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/

// Strips anything non-numeric as the user types and caps length at 10, so it's
// physically impossible to type a letter/symbol or an 11th digit into the field.
export function sanitizeMobileInput(e, onChange) {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
  onChange(e)
}
