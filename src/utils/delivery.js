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

export function deliveryAreaNames(areas = []) {
  return areas.map((area) => area.name).filter(Boolean)
}

export function serviceRegionName(areas = []) {
  return areas.find((area) => !area.isNamedZone)?.name || areas[0]?.name || ''
}
