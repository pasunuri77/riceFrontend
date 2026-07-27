import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '../../context/ToastContext'

export default function Footer() {
  const [email, setEmail] = useState('')
  const { showToast } = useToast()

  const subscribe = (e) => {
    e.preventDefault()
    if (!email) return
    showToast('Subscribed to newsletter!', 'success')
    setEmail('')
  }

  return (
    <footer className="bg-ink text-white/80 mt-16 pb-20 lg:pb-0">
      <div className="bg-primary-600">
        <div className="container-app py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-display font-bold text-xl">Join our Newsletter</h3>
            <p className="text-white/80 text-sm mt-1">Get offers on premium rice brands straight to your inbox.</p>
          </div>
          <form onSubmit={subscribe} className="flex w-full md:w-auto gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="Enter your email"
              className="rounded-lg px-4 py-2.5 text-sm text-ink w-full md:w-72 outline-none"
            />
            <button className="bg-ink text-white font-semibold px-5 rounded-lg text-sm hover:bg-black">Subscribe</button>
          </form>
        </div>
      </div>

      <div className="container-app py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🌾</span>
            <span className="font-display font-extrabold text-lg text-white">RiceBazaar</span>
          </div>
          <p className="text-sm text-white/50 leading-relaxed">India's trusted online destination for premium Basmati and regional rice varieties, for homes and businesses alike.</p>
          <div className="flex gap-3 mt-4">
            <Facebook className="w-4 h-4 hover:text-primary-400 cursor-pointer" />
            <Instagram className="w-4 h-4 hover:text-primary-400 cursor-pointer" />
            <Twitter className="w-4 h-4 hover:text-primary-400 cursor-pointer" />
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-primary-400">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-primary-400">Contact Us</Link></li>
            <li><Link to="/faq" className="hover:text-primary-400">FAQ</Link></li>
            <li><Link to="/products" className="hover:text-primary-400">Shop All Rice</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/privacy-policy" className="hover:text-primary-400">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-primary-400">Terms &amp; Conditions</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Get in Touch</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> 12 Grain Market, New Delhi, India</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91 98765 43210</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@ricebazaar.in</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} RiceBazaar. All rights reserved. Prices shown are in Indian Rupees (₹).
      </div>
    </footer>
  )
}
