import { useEffect, useState } from 'react'
import deliveryApi from '../api/deliveryApi'

let cache = null
let pending = null

function loadDeliveryConfig() {
  if (cache) return Promise.resolve(cache)
  if (!pending) {
    pending = Promise.allSettled([
      deliveryApi.getStoreLocation(),
      deliveryApi.getDeliveryAreas(),
    ]).then(([storeResult, areasResult]) => {
      const store = storeResult.status === 'fulfilled' ? storeResult.value : null
      const areas = areasResult.status === 'fulfilled' && Array.isArray(areasResult.value) ? areasResult.value : []
      cache = {
        store,
        areas,
        storeError: storeResult.status === 'rejected',
        areasError: areasResult.status === 'rejected',
      }
      return cache
    }).finally(() => {
      pending = null
    })
  }
  return pending
}

export default function useDeliveryConfig() {
  const [state, setState] = useState(() => ({
    store: cache?.store || null,
    areas: cache?.areas || [],
    storeError: !!cache?.storeError,
    areasError: !!cache?.areasError,
    loading: !cache,
  }))

  useEffect(() => {
    let active = true
    loadDeliveryConfig()
      .then((next) => {
        if (active) setState({ ...next, loading: false })
      })
      .catch(() => {
        if (active) setState((current) => ({ ...current, loading: false, storeError: true, areasError: true }))
      })
    return () => {
      active = false
    }
  }, [])

  return state
}
