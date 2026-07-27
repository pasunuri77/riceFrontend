import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import Breadcrumb from '../../components/ui/Breadcrumb'
import { useToast } from '../../context/ToastContext'

export default function Contact() {
  const { showToast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const submit = (e) => {
    e.preventDefault()
    showToast('Message sent! Our team will get back to you soon.', 'success')
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="container-app py-10">
      <Breadcrumb items={[{ label: 'Contact Us' }]} />
      <div className="text-center mb-10">
        <h1 className="section-title">Get in Touch</h1>
        <p className="section-sub">We'd love to hear from you — questions, feedback or bulk order enquiries</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Your Name</label>
                <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Email Address</label>
                <input required type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label-field">Subject</label>
              <input required className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Message</label>
              <textarea required rows={5} className="input-field" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <button className="btn-primary w-full sm:w-auto"><Send className="w-4 h-4" /> Send Message</button>
          </form>
        </div>

        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="card p-5 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <div><p className="font-semibold text-sm">Address</p><p className="text-sm text-ink/50">12 Grain Market, New Delhi, India - 110001</p></div>
          </div>
          <div className="card p-5 flex items-start gap-3">
            <Phone className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <div><p className="font-semibold text-sm">Phone</p><p className="text-sm text-ink/50">+91 98765 43210</p></div>
          </div>
          <div className="card p-5 flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <div><p className="font-semibold text-sm">Email</p><p className="text-sm text-ink/50">support@ricebazaar.in</p></div>
          </div>
          <div className="card p-5 flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <div><p className="font-semibold text-sm">Business Hours</p><p className="text-sm text-ink/50">Mon - Sat: 9:00 AM - 7:00 PM</p></div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
