import { Truck } from 'lucide-react'
import DashboardShell from './DashboardShell'

// Deliberately minimal - a delivery partner has exactly one job in this app
// (see their assigned deliveries, upload proof), not a full staff-style
// sidebar with permissions/products/customers etc. No dedicated profile page
// either - DashboardShell's header dropdown already gives them Sign Out,
// which is the only account action they need.
const NAV_ITEMS = [
  { to: '/delivery', icon: Truck, label: 'My Deliveries', end: true, always: true },
]

export default function DeliveryPartnerLayout() {
  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      brandLabel="Delivery Partner"
      requireRole={['delivery_partner']}
      profileTo="/delivery"
      showBackToStore={false}
    />
  )
}
