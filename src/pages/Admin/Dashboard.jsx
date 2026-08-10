import { LayoutDashboard } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import EmptyState from '../../components/ui/EmptyState'

export default function AdminDashboard() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Dashboard' }]} />
      <PageHeader title="Admin Dashboard" subtitle="Overview of your store's performance" />
      <EmptyState
        icon={LayoutDashboard}
        title="Nothing to show here"
        subtitle="Store statistics aren't displayed on this page."
        actionLabel="Manage Products"
        actionTo="/admin/products"
      />
    </div>
  )
}
