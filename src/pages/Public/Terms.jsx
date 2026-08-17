import Breadcrumb from '../../components/ui/Breadcrumb'

const SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By accessing or using RiceBazaar, you agree to be bound by these Terms & Conditions and our Privacy Policy.' },
  { title: '2. Account Registration', body: 'Users must provide accurate information during registration.' },
  { title: '3. Orders & Pricing', body: 'All prices are listed in US Dollars ($) and are subject to change without notice. Orders are confirmed only after successful payment or COD confirmation.' },
  { title: '4. Delivery', body: 'Estimated delivery dates are provided at checkout but are not guaranteed. Delays due to logistics or weather are outside our control.' },
  { title: '5. Returns & Refunds', body: 'Unopened products may be returned within 7 days of delivery. Refunds are processed within 5-7 business days of return approval.' },
  { title: '6. Limitation of Liability', body: 'RiceBazaar is not liable for indirect damages arising from use of the platform, to the maximum extent permitted by law.' },
  { title: '7. Governing Law', body: 'These terms are governed by the laws of the State of Texas, with jurisdiction in Austin, Texas courts.' },
]

export default function Terms() {
  return (
    <div className="container-app py-10 max-w-3xl">
      <Breadcrumb items={[{ label: 'Terms & Conditions' }]} />
      <h1 className="section-title mb-2">Terms &amp; Conditions</h1>
      <p className="text-ink/40 text-sm mb-8">Last updated: July 1, 2026</p>
      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="font-bold text-ink mb-1.5">{s.title}</h2>
            <p className="text-sm text-ink/60 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
