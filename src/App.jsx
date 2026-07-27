import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

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

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
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

        <Route path="*" element={<Home />} />
      </Routes>
    </>
  )
}
