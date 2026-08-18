// RiceBazaar's supported delivery configuration - single source of truth so the
// Home page section, the "Check Delivery Area" modal, and Checkout's delivery-
// area label can never drift apart. Scoped to one city today (Austin, TX) but
// shaped so more cities/zones can be appended later without changing callers -
// see FUTURE_CITIES below for what's planned but not yet active.
export const STORE_LOCATION = {
  name: 'RiceBazaar',
  address: '801 Wells Branch Parkway',
  area: 'Pflugerville',
  city: 'Pflugerville',
  state: 'Texas',
  stateCode: 'TX',
  zip: '78660',
  country: 'United States',
  countryCode: 'US',
}

export const STORE_ADDRESS_LINE = `${STORE_LOCATION.address}, ${STORE_LOCATION.city}, ${STORE_LOCATION.stateCode} ${STORE_LOCATION.zip}`

export const SERVICE_CITY = { city: 'Austin', state: 'Texas', stateCode: 'TX' }

// Precise street address, not just an area-level search - links straight to
// the exact storefront on Google Maps.
export const STORE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS_LINE)}`

// Exactly one ZIP per named Austin zone. Every ZIP in this file (these 5 plus
// GREATER_AUSTIN_SUB_CITIES below) is seeded into the backend's
// serviceable_pincodes table, so this data and the real delivery-check
// enforcement agree - anything not listed here is correctly denied server-side.
export const DELIVERY_AREAS = [
  {
    id: 'downtown-austin',
    name: 'Downtown Austin',
    description: 'Fresh Sona Masoori Rice delivered to homes across Downtown Austin.',
    zipCodes: ['78701'],
  },
  {
    id: 'north-austin',
    name: 'North Austin',
    description: 'Fresh Sona Masoori Rice delivered to homes across North Austin.',
    zipCodes: ['78758'],
  },
  {
    id: 'south-austin',
    name: 'South Austin',
    description: 'Fresh Sona Masoori Rice delivered to homes across South Austin.',
    zipCodes: ['78745'],
  },
  {
    id: 'east-austin',
    name: 'East Austin',
    description: 'Fresh Sona Masoori Rice delivered to homes across East Austin.',
    zipCodes: ['78723'],
  },
  {
    id: 'west-austin',
    name: 'West Austin',
    description: 'Fresh Sona Masoori Rice delivered to homes across West Austin.',
    zipCodes: ['78735'],
  },
]

// Not active yet - further-out expansion cities, listed here so Admin/engineering
// has a documented target without turning any of them on. Do not surface these
// in customer-facing copy.
export const FUTURE_CITIES = ['Dallas', 'Houston']

// The store's declared service region: Greater Austin, TX - the 5 named Austin
// zones above plus the surrounding sub-cities/suburbs that make up the metro
// area. Each sub-city's ZIPs are real, well-known ZIP codes for that city, not
// invented. These are also seeded into the backend's serviceable_pincodes
// table (matches this list exactly), so real orders from any of these ZIPs
// are actually accepted, not just shown as available in this informational
// checker. Keep this list and the backend table in sync if either changes.
export const GREATER_AUSTIN_SUB_CITIES = [
  { name: 'Round Rock', zipCodes: ['78664', '78665', '78681'] },
  { name: 'Cedar Park', zipCodes: ['78613', '78630'] },
  { name: 'Pflugerville', zipCodes: ['78660'] },
  { name: 'Georgetown', zipCodes: ['78626', '78628', '78633'] },
  { name: 'San Marcos', zipCodes: ['78666'] },
  { name: 'Leander', zipCodes: ['78641'] },
  { name: 'Kyle', zipCodes: ['78640'] },
  { name: 'Buda', zipCodes: ['78610'] },
]

// Flat list of every serviceable location's display name (5 named Austin
// zones + 8 Greater Austin sub-cities) - for UI that shows the whole coverage
// area at a glance (e.g. the Home page hero) without callers having to know
// about the two-list split above.
export const ALL_LOCATION_NAMES = [
  ...DELIVERY_AREAS.map((a) => a.name),
  ...GREATER_AUSTIN_SUB_CITIES.map((c) => c.name),
]

// Best-effort only (see note above) - returns null for a ZIP outside all 5
// zones, which callers should treat as "unknown/not our informational match",
// not as an authoritative "not deliverable" (that's the real backend check).
export function findDeliveryAreaForZip(zip) {
  const clean = (zip || '').replace(/\D/g, '').slice(0, 5)
  if (clean.length !== 5) return null
  return DELIVERY_AREAS.find((a) => a.zipCodes.includes(clean)) || null
}

// Wider check across the whole Greater Austin store location (5 named Austin
// zones + surrounding sub-cities). Returns { areaName, isNamedZone } or null.
// Both are backend-enforced today; `isNamedZone` just distinguishes one of the
// 5 named Austin zones from a sub-city, in case callers want to word the two
// differently (e.g. "Downtown Austin" vs "Round Rock area").
export function findGreaterAustinAreaForZip(zip) {
  const clean = (zip || '').replace(/\D/g, '').slice(0, 5)
  if (clean.length !== 5) return null
  const zone = findDeliveryAreaForZip(clean)
  if (zone) return { areaName: zone.name, isNamedZone: true }
  const subCity = GREATER_AUSTIN_SUB_CITIES.find((c) => c.zipCodes.includes(clean))
  if (subCity) return { areaName: subCity.name, isNamedZone: false }
  return null
}
