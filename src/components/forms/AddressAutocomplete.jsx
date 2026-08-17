import { useCallback, useEffect, useRef, useState } from 'react'
import { loadGoogleMaps, parseAddressComponents } from '../../utils/googleMaps'

// Address Line 1 input with its own suggestions dropdown, backed by the new
// Google Places API (AutocompleteSuggestion + Place, session-tokened) - same
// mechanism as SquareEdgeSports' AddressAutocomplete, restricted to US
// addresses. Renders its own list instead of the native Google-attached
// dropdown so it can match the app's own styling.
export default function AddressAutocomplete({ value, onChange, onPlaceSelect, placeholder, className, ...rest }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const [ready, setReady] = useState(false)

  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const sessionTokenRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled) return
        sessionTokenRef.current = new maps.places.AutocompleteSessionToken()
        setReady(true)
      })
      .catch(() => {
        // Autocomplete unavailable - input still works as a normal text field.
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchSuggestions = useCallback(async (query) => {
    if (!ready || !query || query.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const { suggestions: results } =
        await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          includedRegionCodes: ['us'],
          sessionToken: sessionTokenRef.current,
        })

      if (!results?.length) {
        setSuggestions([])
        setOpen(false)
        return
      }

      setSuggestions(results.map((s) => ({
        prediction: s.placePrediction,
        primary: s.placePrediction.mainText?.text || s.placePrediction.text?.text || '',
        secondary: s.placePrediction.secondaryText?.text || '',
      })))
      setOpen(true)
      setHighlighted(-1)
    } catch {
      setSuggestions([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [ready])

  const handleInputChange = (e) => {
    const query = e.target.value
    onChange(e)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300)
  }

  const handleSelect = async (item) => {
    const selectedText = item.prediction.text?.text ||
      (item.secondary ? `${item.primary}, ${item.secondary}` : item.primary)
    const line1 = selectedText.trim()

    setOpen(false)
    setSuggestions([])
    setLoading(true)
    onChange({ target: { value: line1 } })

    try {
      const place = item.prediction.toPlace()
      await place.fetchFields({ fields: ['addressComponents'], sessionToken: sessionTokenRef.current })
      // Refresh session token after a completed session.
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
      onPlaceSelect?.(parseAddressComponents(place.addressComponents || []))
    } catch {
      // Details fetch failed - line1 is still set from the suggestion text.
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (!open || !suggestions.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)) }
    if (e.key === 'Enter' && highlighted >= 0) { e.preventDefault(); handleSelect(suggestions[highlighted]) }
    if (e.key === 'Escape') setOpen(false)
  }

  const clear = () => {
    onChange({ target: { value: '' } })
    onPlaceSelect?.({ line1: '', city: '', state: '', zip: '', country: '' })
    setSuggestions([])
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={`${className} pr-9`}
        {...rest}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
        {loading ? (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        ) : value ? (
          <button type="button" onClick={clear} tabIndex={-1} className="text-ink/30 hover:text-ink/60 text-base leading-none px-0.5">&times;</button>
        ) : null}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-black/10 rounded-xl shadow-card overflow-hidden">
          <p className="text-[10px] text-ink/40 uppercase tracking-wide px-3.5 pt-2.5 pb-1.5">Select an address to auto-fill city, state &amp; ZIP</p>
          {suggestions.map((s, i) => (
            <button
              key={s.prediction.placeId}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-3.5 py-2.5 border-t border-black/5 transition-colors ${highlighted === i ? 'bg-primary-50' : 'hover:bg-black/[0.02]'}`}
            >
              <p className="text-sm font-medium text-ink truncate">{s.primary}</p>
              {s.secondary ? (
                <p className="text-xs text-ink/40 truncate mt-0.5">{s.secondary}</p>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
