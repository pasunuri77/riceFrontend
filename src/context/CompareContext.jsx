import { createContext, useContext, useState } from 'react'
import { useToast } from './ToastContext'

const CompareContext = createContext(null)

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([])
  const { showToast } = useToast()

  const toggleCompare = (product) => {
    setCompareList((prev) => {
      const exists = prev.find((p) => p.id === product.id)
      if (exists) return prev.filter((p) => p.id !== product.id)
      if (prev.length >= 3) {
        showToast('You can compare up to 3 products only', 'error')
        return prev
      }
      return [...prev, product]
    })
  }

  const isComparing = (id) => compareList.some((p) => p.id === id)
  const clearCompare = () => setCompareList([])

  return (
    <CompareContext.Provider value={{ compareList, toggleCompare, isComparing, clearCompare }}>
      {children}
    </CompareContext.Provider>
  )
}

export const useCompare = () => useContext(CompareContext)
