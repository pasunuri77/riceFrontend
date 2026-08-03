import { useState } from 'react'
import { Plus, MapPin } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Breadcrumb from '../../components/ui/Breadcrumb'
import AddressCard from '../../components/forms/AddressCard'
import AddressForm from '../../components/forms/AddressForm'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function Addresses() {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth()
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const openAdd = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (addr) => { setEditing(addr); setModalOpen(true) }

  const handleSubmit = (data) => {
    if (editing) {
      updateAddress(editing.id, data)
      showToast('Address updated', 'success')
    } else {
      addAddress(data)
      showToast('Address saved', 'success')
    }
    setModalOpen(false)
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Addresses' }]} />
      <PageHeader
        title="Manage Addresses"
        subtitle="Save multiple addresses for faster checkout"
        action={<button onClick={openAdd} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add Address</button>}
      />

      {addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="No saved addresses" subtitle="Add your first address to speed up checkout." actionLabel="Add Address" actionTo="#" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((a) => (
            <AddressCard key={a.id} address={a} onEdit={openEdit} onDelete={deleteAddress} onSetDefault={setDefaultAddress} />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Address' : 'Add New Address'} maxWidth="max-w-2xl">
        <AddressForm initial={editing} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} submitLabel={editing ? 'Update Address' : 'Save Address'} />
      </Modal>
    </div>
  )
}
