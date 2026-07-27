import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Breadcrumb from '../../components/ui/Breadcrumb'

const FAQS = [
  { q: 'What is the minimum order quantity?', a: 'Minimum order quantity varies by product, typically starting from 1kg for retail packs. Bulk/business orders can go up to 500kg or more.' },
  { q: 'Do you deliver across India?', a: 'Yes, we deliver pan-India. Delivery timelines vary by location, typically 3-7 business days.' },
  { q: 'Is there a discount for bulk orders?', a: 'Yes, bulk orders get access to wholesale pricing and GST invoicing.' },
  { q: 'What payment methods are accepted?', a: 'We accept UPI, credit/debit cards, net banking and cash on delivery for eligible orders.' },
  { q: 'Can I return rice if I am not satisfied?', a: 'Yes, unopened packs can be returned within 7 days of delivery. Please refer to our Terms & Conditions.' },
  { q: 'How is the rice packaged?', a: 'All rice is packed in food-grade, tamper-proof packaging to preserve freshness during transit.' },
  { q: 'Do you offer organic rice options?', a: 'Yes, we have a dedicated Organic Rice category with certified organic products.' },
  { q: 'How can I track my order?', a: 'Once shipped, you can track your order from the "My Orders" section in your dashboard.' },
]

export default function FAQ() {
  const [open, setOpen] = useState(0)
  return (
    <div className="container-app py-10 max-w-3xl">
      <Breadcrumb items={[{ label: 'FAQ' }]} />
      <div className="text-center mb-10">
        <h1 className="section-title">Frequently Asked Questions</h1>
        <p className="section-sub">Everything you need to know about shopping with RiceBazaar</p>
      </div>
      <div className="space-y-3">
        {FAQS.map((f, i) => (
          <div key={i} className="card overflow-hidden">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
              <span className="font-semibold text-sm">{f.q}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 text-primary-600 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm text-ink/60 leading-relaxed">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}
