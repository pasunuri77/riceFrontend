import Breadcrumb from '../../components/ui/Breadcrumb'
import Accordion from '../../components/ui/Accordion'
import { FAQS } from '../../data/faqs'

export default function FAQ() {
  return (
    <div className="container-app py-10 max-w-3xl">
      <Breadcrumb items={[{ label: 'FAQ' }]} />
      <div className="text-center mb-10">
        <h1 className="section-title">Frequently Asked Questions</h1>
        <p className="section-sub">Everything you need to know about shopping with RiceBazaar</p>
      </div>
      <Accordion items={FAQS} />
    </div>
  )
}
