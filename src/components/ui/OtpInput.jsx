import { useRef } from 'react'

export default function OtpInput({ length = 6, value, onChange, error, autoFocus }) {
  const inputRefs = useRef([])
  const digits = Array.from({ length }, (_, i) => value[i] || '')

  const setDigit = (index, digit) => {
    const next = digits.slice()
    next[index] = digit
    onChange(next.join(''))
  }

  const handleChange = (index, e) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) { setDigit(index, ''); return }
    // Typing fast can land more than one digit in a single box (e.g. mobile autofill) -
    // take the last one typed and push focus forward.
    setDigit(index, raw.slice(-1))
    if (index < length - 1) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    onChange(pasted.padEnd(digits.length, '').slice(0, length))
    const focusIndex = Math.min(pasted.length, length - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            value={digit}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoFocus={autoFocus && i === 0}
            type="text"
            inputMode="numeric"
            maxLength={1}
            aria-label={`Digit ${i + 1} of ${length}`}
            aria-invalid={!!error}
            className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 bg-white outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 ${
              error ? 'border-red-300' : 'border-black/10'
            }`}
          />
        ))}
      </div>
      {error && <p role="alert" className="text-xs text-red-500 mt-2 text-center font-medium">{error}</p>}
    </div>
  )
}
