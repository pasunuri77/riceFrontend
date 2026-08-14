import { useCallback, useEffect, useRef, useState } from 'react'
import { loadGoogleMaps, parseAddressComponents } from '../../utils/googleMaps'

// Address Line 1 input with its own suggestions dropdown, backed by Google
// Places (restricted to US addresses). Renders its own list instead of the
// native Google-attached dropdown so it can match the app's own styling.
export default function AddressAutocomplete({ value, onChange, onPlaceSelect, placeholder, className, ...rest }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const [ready, setReady] = useState(false)

  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const autocompleteServiceRef = useRef(null)
  const placesServiceRef = useRef(null)
  const sessionTokenRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled) return
        autocompleteServiceRef.current = new maps.places.AutocompleteService()
        placesServiceRef.current = new maps.places.PlacesService(document.createElement('div'))
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

  const fetchSuggestions = useCallback((query) => {
    if (!ready || !query || query.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    autocompleteServiceRef.current.getPlacePredictions(
      { input: query, componentRestrictions: { country: 'us' }, types: ['address'], sessionToken: sessionTokenRef.current },
      (results, status) => {
        setLoading(false)
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results) {
          setSuggestions([])
          setOpen(false)
          return
        }
        setSuggestions(results)
        setOpen(true)
        setHighlighted(-1)
      },
    )
  }, [ready])

  const handleInputChange = (e) => {
    const query = e.target.value
    onChange(e)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300)
  }

  const handleSelect = (prediction) => {
    setOpen(false)
    setSuggestions([])
    setLoading(true)
    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['address_components'], sessionToken: sessionTokenRef.current },
      (place, status) => {
        setLoading(false)
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
        onChange({ target: { value: prediction.description } })
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          onPlaceSelect?.(parseAddressComponents(place.address_components))
        }
      },
    )
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
              key={s.place_id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-3.5 py-2.5 border-t border-black/5 transition-colors ${highlighted === i ? 'bg-primary-50' : 'hover:bg-black/[0.02]'}`}
            >
              <p className="text-sm font-medium text-ink truncate">{s.structured_formatting?.main_text || s.description}</p>
              {s.structured_formatting?.secondary_text ? (
                <p className="text-xs text-ink/40 truncate mt-0.5">{s.structured_formatting.secondary_text}</p>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
