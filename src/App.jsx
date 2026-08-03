import { Routes, Route } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import OfflineBanner from './components/system/OfflineBanner'
import GlobalLoadingBar from './components/ui/GlobalLoadingBar'
import NotFound from './pages/System/NotFound'
import Forbidden from './pages/System/Forbidden'
import ServerError from './pages/System/ServerError'

import PublicLayout from './components/layout/PublicLayout'
import UserLayout from './components/layout/UserLayout'
import AdminLayout from './components/layout/AdminLayout'

import Home from './pages/Public/Home'
import About from './pages/Public/About'
import Contact from './pages/Public/Contact'
import FAQ from './pages/Public/FAQ'
import PrivacyPolicy from './pages/Public/PrivacyPolicy'
import Terms from './pages/Public/Terms'
import Login from './pages/Public/Login'
import Register from './pages/Public/Register'
import ForgotPassword from './pages/Public/ForgotPassword'
import VerifyOtp from './pages/Public/VerifyOtp'
import Products from './pages/Public/Products'
import ProductDetails from './pages/Public/ProductDetails'

import Cart from './pages/User/Cart'
import Checkout from './pages/User/Checkout'
import Wishlist from './pages/User/Wishlist'
import Compare from './pages/User/Compare'
import UserDashboard from './pages/User/Dashboard'
import Orders from './pages/User/Orders'
import Addresses from './pages/User/Addresses'
import Profile from './pages/User/Profile'

import AdminDashboard from './pages/Admin/Dashboard'
import AdminProducts from './pages/Admin/Products'
import AdminCustomers from './pages/Admin/Customers'
import AdminOrders from './pages/Admin/Orders'
import AdminReports from './pages/Admin/Reports'
import AdminSettings from './pages/Admin/Settings'

const scrollPositions = new Map()

// Restores the scroll position a route was at when the user navigated away from it
// (back/forward), while fresh forward navigations still start at the top.
function ScrollRestoration() {
  const location = useLocation()
  const navType = useNavigationType()
  const prevKey = useRef(null)

  useEffect(() => {
    if (prevKey.current) {
      scrollPositions.set(prevKey.current, window.scrollY)
    }
    prevKey.current = location.key

    if (navType === 'POP' && scrollPositions.has(location.key)) {
      window.scrollTo(0, scrollPositions.get(location.key))
    } else {
      window.scrollTo(0, 0)
    }
  }, [location.key, navType])

  return null
}

export default function App() {
  return (
    <>
      <OfflineBanner />
      <GlobalLoadingBar />
      <ScrollRestoration />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/compare" element={<Compare />} />
        </Route>

        <Route path="/dashboard" element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="compare" element={<Compare />} />
          <Route path="cart" element={<Cart />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="/403" element={<Forbidden />} />
        <Route path="/500" element={<ServerError />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
