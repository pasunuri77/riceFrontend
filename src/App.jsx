import { Routes, Route } from 'react-router-dom'
import { useEffect, useRef, lazy, Suspense } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import OfflineBanner from './components/system/OfflineBanner'
import GlobalLoadingBar from './components/ui/GlobalLoadingBar'
import Loader from './components/ui/Loader'
import CommandPalette from './components/ui/CommandPalette'
import BackToTop from './components/ui/BackToTop'

import PublicLayout from './components/layout/PublicLayout'
import UserLayout from './components/layout/UserLayout'
import AdminLayout from './components/layout/AdminLayout'

// Every page below is its own chunk, loaded only when its route is visited -
// keeps the initial bundle to just the shell + whichever page loads first.
const Home = lazy(() => import('./pages/Public/Home'))
const About = lazy(() => import('./pages/Public/About'))
const Contact = lazy(() => import('./pages/Public/Contact'))
const FAQ = lazy(() => import('./pages/Public/FAQ'))
const PrivacyPolicy = lazy(() => import('./pages/Public/PrivacyPolicy'))
const Terms = lazy(() => import('./pages/Public/Terms'))
const Login = lazy(() => import('./pages/Public/Login'))
const Register = lazy(() => import('./pages/Public/Register'))
const ForgotPassword = lazy(() => import('./pages/Public/ForgotPassword'))
const VerifyOtp = lazy(() => import('./pages/Public/VerifyOtp'))
const Products = lazy(() => import('./pages/Public/Products'))
const ProductDetails = lazy(() => import('./pages/Public/ProductDetails'))

const Cart = lazy(() => import('./pages/User/Cart'))
const Checkout = lazy(() => import('./pages/User/Checkout'))
const UserDashboard = lazy(() => import('./pages/User/Dashboard'))
const Orders = lazy(() => import('./pages/User/Orders'))
const OrderDetail = lazy(() => import('./pages/User/OrderDetail'))
const Addresses = lazy(() => import('./pages/User/Addresses'))
const Profile = lazy(() => import('./pages/User/Profile'))

const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'))
const AdminProducts = lazy(() => import('./pages/Admin/Products'))
const AdminCustomers = lazy(() => import('./pages/Admin/Customers'))
const AdminOrders = lazy(() => import('./pages/Admin/Orders'))
const AdminNewOrder = lazy(() => import('./pages/Admin/NewOrder'))
const AdminPayments = lazy(() => import('./pages/Admin/Payments'))
const AdminCoupons = lazy(() => import('./pages/Admin/Coupons'))
const AdminReports = lazy(() => import('./pages/Admin/Reports'))
const AdminDeliveryTax = lazy(() => import('./pages/Admin/DeliveryTax'))
const AdminProfile = lazy(() => import('./pages/Admin/Profile'))

const NotFound = lazy(() => import('./pages/System/NotFound'))
const Forbidden = lazy(() => import('./pages/System/Forbidden'))
const ServerError = lazy(() => import('./pages/System/ServerError'))

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
      <CommandPalette />
      <BackToTop />
      <Suspense fallback={<Loader />}>
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
          </Route>

          <Route path="/dashboard" element={<UserLayout />}>
            <Route index element={<UserDashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="cart" element={<Cart />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/new" element={<AdminNewOrder />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="delivery-tax" element={<AdminDeliveryTax />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          <Route path="/403" element={<Forbidden />} />
          <Route path="/500" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}
