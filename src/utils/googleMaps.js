// Loads the Google Maps JS API (Places library, new/Preview API surface) once
// and shares the same promise across every caller, so multiple autocomplete
// inputs on one page don't each inject their own <script> tag. `v=beta` is
// required for AutocompleteSuggestion/Place - the same approach SquareEdgeSports
// uses, since the legacy Autocomplete widget/AutocompleteService are deprecated.
let loadPromise = null

export function loadGoogleMaps() {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.places?.AutocompleteSuggestion) {
      resolve(window.google.maps)
      return
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'))
      return
    }

    const existing = document.querySelector('script[data-google-maps]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps))
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=beta`
    script.async = true
    script.defer = true
    script.dataset.googleMaps = 'true'
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => { loadPromise = null; reject(new Error('Failed to load Google Maps script')) }
    document.head.appendChild(script)
  })

  return loadPromise
}

// Pulls the address parts we care about out of a Place's `addressComponents`
// (new Places API - camelCase fields: longText/shortText, not the legacy
// address_components' long_name/short_name). Google splits an address into
// many small parts (street_number, route, locality, ...) with no single
// "line 1" field, so we assemble one.
export function parseAddressComponents(components = []) {
  const get = (type) => components.find((c) => c.types.includes(type))?.longText || ''
  const getShort = (type) => components.find((c) => c.types.includes(type))?.shortText || ''

  const streetNumber = get('street_number')
  const route = get('route')
  const line1 = [streetNumber, route].filter(Boolean).join(' ')

  const countryCode = getShort('country')

  return {
    line1: line1 || get('neighborhood') || get('sublocality'),
    city: get('locality') || get('sublocality') || get('postal_town'),
    state: get('administrative_area_level_1'),
    zip: get('postal_code'),
    country: countryCode ? regionCodeToName(countryCode) : '',
  }
}

// Turns a 2-letter region code ("US") into a display name ("United States").
function regionCodeToName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}
