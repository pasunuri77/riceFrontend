// RiceBazaar's supported delivery configuration - single source of truth so the
// Home page section, the "Check Delivery Area" modal, and Checkout's delivery-
// area label can never drift apart. Scoped to one city today (Austin, TX) but
// shaped so more cities/zones can be appended later without changing callers -
// see FUTURE_CITIES below for what's planned but not yet active.
export const STORE_LOCATION = {
  name: 'RiceBazaar',
  area: 'North Austin',
  city: 'Austin',
  state: 'Texas',
  stateCode: 'TX',
  country: 'United States',
  countryCode: 'US',
}

export const SERVICE_CITY = { city: 'Austin', state: 'Texas', stateCode: 'TX' }

// Exactly one ZIP per area - this is the real, enforced service area. These
// same 5 ZIPs are seeded into the backend's serviceable_pincodes table, so
// this list and the real delivery-check enforcement now agree with each other
// (previously this was a broader informational-only guess with no backend
// data behind it at all - the pincode table was empty, so every real order
// would have failed the delivery check regardless of what this file said).
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
// invented. This list is WIDER than DELIVERY_AREAS/what's currently seeded in
// the backend's serviceable_pincodes table (only the 5 single Austin ZIPs
// above are actually enforced at checkout right now) - it drives the
// informational "is my ZIP in our area?" checker only. If real order-blocking
// needs to match this wider list, the backend pincode table needs updating too.
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
// `isNamedZone` is true only for the 5 zones that are actually backend-enforced
// today - the frontend can use it to soften the message for sub-city ZIPs.
export function findGreaterAustinAreaForZip(zip) {
  const clean = (zip || '').replace(/\D/g, '').slice(0, 5)
  if (clean.length !== 5) return null
  const zone = findDeliveryAreaForZip(clean)
  if (zone) return { areaName: zone.name, isNamedZone: true }
  const subCity = GREATER_AUSTIN_SUB_CITIES.find((c) => c.zipCodes.includes(clean))
  if (subCity) return { areaName: subCity.name, isNamedZone: false }
  return null
}
