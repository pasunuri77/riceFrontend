import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useLocalStorage from '../hooks/useLocalStorage'
import useIdleLogout from '../hooks/useIdleLogout'
import authApi from '../api/authApi'
import addressApi from '../api/addressApi'
import { getToken } from '../api/client'
import { useToast } from './ToastContext'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage('rb_user', null)
  const [addresses, setAddresses] = useState([])
  const navigate = useNavigate()
  const { showToast } = useToast()

  // Self-heal stale sessions: a user object with no matching token isn't a real
  // logged-in session (e.g. leftover data from before the backend existed) - clear it.
  useEffect(() => {
    if (user && !getToken()) setUser(null)
  }, [])

  // client.js drops the token and fires this when a request 401/403s while a
  // token was attached (e.g. the account behind it was deleted server-side).
  useEffect(() => {
    const onAuthInvalid = () => {
      setUser(null)
      showToast('Your session has expired. Please log in again.', 'error')
      navigate('/login')
    }
    window.addEventListener('auth:invalid', onAuthInvalid)
    return () => window.removeEventListener('auth:invalid', onAuthInvalid)
  }, [navigate, showToast])

  const handleIdle = useCallback(() => {
    if (!user) return
    setUser(null)
    showToast("You've been signed out due to inactivity.", 'info')
    navigate('/login')
  }, [user, navigate, showToast])

  useIdleLogout(!!user, handleIdle)

  useEffect(() => {
    if (!user) { setAddresses([]); return }
    // If the user logs out (or switches accounts) while this request is still in
    // flight, its response arrives after `user` has already changed - applying it
    // then would leak the previous account's addresses into the new/logged-out
    // state. `ignore` drops any response that resolves after this effect's own
    // user has stopped being the current one.
    let ignore = false
    addressApi.list()
      .then((list) => { if (!ignore) setAddresses(list) })
      .catch(() => { if (!ignore) setAddresses([]) })
    return () => { ignore = true }
  }, [user?.id])

  const login = (credentials) => authApi.login(credentials).then((u) => { setUser(u); return u })
  const register = (data) => authApi.register(data).then((u) => { setUser(u); return u })
  const updateProfile = (data) => authApi.updateProfile(data).then((u) => { setUser(u); return u })
  const updateAdminProfile = (data) => authApi.updateAdminProfile(data).then((u) => { setUser(u); return u })
  const logout = () => authApi.logout().then(() => setUser(null))

  const addAddress = (addr) => addressApi.create(addr).then(() => addressApi.list()).then(setAddresses)
  const updateAddress = (id, addr) => addressApi.update(id, addr).then(() => addressApi.list()).then(setAddresses)
  const deleteAddress = (id) => addressApi.remove(id).then(() => addressApi.list()).then(setAddresses)
  const setDefaultAddress = (id) => addressApi.setDefault(id).then(setAddresses)

  return (
    <AuthContext.Provider
      value={{ user, login, register, updateProfile, updateAdminProfile, logout, addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
