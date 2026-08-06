import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Accordion from '../ui/Accordion'
import { FAQS } from '../../data/faqs'

export default function FaqPreview() {
  return (
    <section className="container-app py-14 max-w-3xl">
      <div className="text-center mb-8">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-sub">Quick answers to common questions</p>
      </div>
      <Accordion items={FAQS.slice(0, 5)} />
      <div className="text-center mt-6">
        <Link to="/faq" className="inline-flex items-center gap-1 text-primary-600 font-semibold text-sm hover:text-primary-700">
          View All FAQs <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
