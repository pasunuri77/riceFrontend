import { createContext, useContext, useEffect, useState } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'
import authApi from '../api/authApi'
import addressApi from '../api/addressApi'
import userApi from '../api/userApi'
import { getToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage('rb_user', null)
  const [addresses, setAddresses] = useState([])

  // Self-heal stale sessions: a user object with no matching token isn't a real
  // logged-in session (e.g. leftover data from before the backend existed) - clear it.
  useEffect(() => {
    if (user && !getToken()) setUser(null)
  }, [])

  // client.js drops the token and fires this when a request 401/403s while a
  // token was attached (e.g. the account behind it was deleted server-side).
  useEffect(() => {
    const onAuthInvalid = () => setUser(null)
    window.addEventListener('auth:invalid', onAuthInvalid)
    return () => window.removeEventListener('auth:invalid', onAuthInvalid)
  }, [])

  useEffect(() => {
    if (!user) { setAddresses([]); return }
    addressApi.list().then(setAddresses).catch(() => setAddresses([]))
  }, [user?.id])

  const login = (credentials) => authApi.login(credentials).then((u) => { setUser(u); return u })
  const register = (data) => authApi.register(data).then((u) => { setUser(u); return u })
  const logout = () => authApi.logout().then(() => setUser(null))
  const updateProfile = (data) => userApi.updateProfile(data).then((u) => { setUser(u); return u })

  const addAddress = (addr) => addressApi.create(addr).then(() => addressApi.list()).then(setAddresses)
  const updateAddress = (id, addr) => addressApi.update(id, addr).then(() => addressApi.list()).then(setAddresses)
  const deleteAddress = (id) => addressApi.remove(id).then(() => addressApi.list()).then(setAddresses)
  const setDefaultAddress = (id) => addressApi.setDefault(id).then(setAddresses)

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateProfile, addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
