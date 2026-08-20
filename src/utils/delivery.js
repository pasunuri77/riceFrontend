export function storeAddressLine(store) {
  if (!store) return ''
  return [store.address, store.city, [store.stateCode, store.zip].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
}

export function storeMapsUrl(store) {
  const address = storeAddressLine(store)
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ''
}

// The homepage badge only shows the cities that make up the general Greater
// Austin coverage area, not the individually-named zones (Downtown/North/
// South/East/West Austin) - those are their own dedicated delivery zones,
// shown separately elsewhere, not part of the "Greater Austin" region label.
export function deliveryAreaNames(areas = []) {
  return areas.filter((area) => !area.namedZone).map((area) => area.name).filter(Boolean)
}

export function serviceRegionName() {
  return 'Greater Austin'
}
