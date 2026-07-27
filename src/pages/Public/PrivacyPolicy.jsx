import Breadcrumb from '../../components/ui/Breadcrumb'

const SECTIONS = [
  { title: '1. Information We Collect', body: 'We collect information you provide during registration and checkout, including name, contact details and address.' },
  { title: '2. How We Use Your Information', body: 'Your information is used to process orders, deliver products, provide customer support and improve our services. We do not sell your personal data to third parties.' },
  { title: '3. Data Security', body: 'We implement industry-standard security measures to protect your personal information from unauthorized access, alteration or disclosure.' },
  { title: '4. Cookies', body: 'We use cookies to enhance your browsing experience, remember your preferences and analyze site traffic.' },
  { title: '5. Third-Party Services', body: 'We may use third-party services for payment processing and delivery logistics, each governed by their own privacy policies.' },
  { title: '6. Your Rights', body: 'You may access, update or request deletion of your personal data at any time via your account settings or by contacting support.' },
  { title: '7. Changes to This Policy', body: 'We may update this Privacy Policy periodically. Continued use of RiceBazaar after changes constitutes acceptance of the revised policy.' },
]

export default function PrivacyPolicy() {
  return (
    <div className="container-app py-10 max-w-3xl">
      <Breadcrumb items={[{ label: 'Privacy Policy' }]} />
      <h1 className="section-title mb-2">Privacy Policy</h1>
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
