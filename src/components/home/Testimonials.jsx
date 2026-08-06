import { motion } from 'framer-motion'
import { Quote, Star } from 'lucide-react'

const TESTIMONIALS = [
  { name: 'Anjali R.', role: 'Home Cook, Bengaluru', quote: 'The Basmati holds its shape perfectly for biryani every single time. Delivery has always been on schedule for us.', rating: 5 },
  { name: 'Suresh K.', role: 'Restaurant Owner, Chennai', quote: 'We order in bulk for our kitchen and the GST invoicing makes accounting painless. Consistent quality batch after batch.', rating: 5 },
  { name: 'Priya M.', role: 'Home Cook, Hyderabad', quote: 'Good aroma, minimal broken grains, and packaging arrives sealed and intact. Our go-to for everyday rice now.', rating: 4 },
]

export default function Testimonials() {
  return (
    <section className="bg-primary-50/40 py-16">
      <div className="container-app">
        <div className="text-center mb-10">
          <h2 className="section-title">What Our Customers Say</h2>
          <p className="section-sub">Feedback from home cooks and business buyers</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card p-6 relative"
            >
              <Quote className="w-8 h-8 text-primary-100 absolute top-4 right-4" aria-hidden="true" />
              <div className="flex gap-0.5 mb-3" aria-label={`${t.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className={`w-4 h-4 ${s < t.rating ? 'fill-primary-400 text-primary-400' : 'text-black/10'}`} aria-hidden="true" />
                ))}
              </div>
              <p className="text-sm text-ink/70 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 pt-4 border-t border-black/5">
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-ink/40">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
