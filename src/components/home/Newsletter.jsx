import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

// UI-only: there's no newsletter/subscription endpoint on the backend yet, so this
// doesn't persist anything - it just confirms the intent was captured. Wire this up
// to a real endpoint once one exists rather than pretending it already subscribes.
export default function Newsletter() {
  const [email, setEmail] = useState('')
  const { showToast } = useToast()

  const onSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) return
    showToast("Thanks! We'll keep you posted.", 'success')
    setEmail('')
  }

  return (
    <section className="container-app pb-16">
      <div className="rounded-2xl2 bg-gradient-to-br from-primary-500 to-primary-700 text-white p-8 sm:p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display">Stay in the Loop</h2>
        <p className="text-white/70 mt-2 max-w-md mx-auto">Get updates on new arrivals, seasonal offers and rice care tips.</p>
        <form onSubmit={onSubmit} className="mt-6 flex max-w-md mx-auto gap-2">
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="flex-1 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-white/50"
          />
          <button type="submit" className="bg-white text-primary-700 font-semibold rounded-xl px-5 py-3 text-sm flex items-center gap-2 hover:bg-white/90 transition">
            <Send className="w-4 h-4" aria-hidden="true" /> Subscribe
          </button>
        </form>
      </div>
    </section>
  )
}
