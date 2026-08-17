import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-ink text-white/80 mt-16 pb-20 lg:pb-0">
      <div className="container-app py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🌾</span>
            <span className="font-display font-extrabold text-lg text-white">RiceBazaar</span>
          </div>
          <p className="text-sm text-white/50 leading-relaxed">Authentic Sona Masoori rice delivered fresh across selected areas of Austin, Texas - for homes and businesses alike.</p>
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
            <li><Link to="/products" className="hover:text-primary-400">Shop</Link></li>
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
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> North Austin, Austin, TX</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> (512) 555-0100</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@ricebazaar.com</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} RiceBazaar. All rights reserved. Prices shown are in US Dollars ($).
      </div>
    </footer>
  )
}
