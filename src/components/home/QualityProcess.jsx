import { motion } from 'framer-motion'
import { Wheat, Cog, ScanSearch, PackageCheck, Truck } from 'lucide-react'

const STEPS = [
  { icon: Wheat, title: 'Sourcing', desc: 'Grain sourced directly from trusted mills and growing regions across India.' },
  { icon: Cog, title: 'Milling', desc: 'Processed with modern milling equipment to preserve grain quality.' },
  { icon: ScanSearch, title: 'Quality Check', desc: 'Every batch checked for purity, moisture and grain consistency.' },
  { icon: PackageCheck, title: 'Packaging', desc: 'Sealed in food-grade packaging to lock in freshness.' },
  { icon: Truck, title: 'Delivery', desc: 'Dispatched to your doorstep, tracked from warehouse to home.' },
]

export default function QualityProcess() {
  return (
    <section className="container-app py-14">
      <div className="text-center mb-10">
        <h2 className="section-title">From Farm to Your Kitchen</h2>
        <p className="section-sub">Every bag goes through a consistent quality process</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 relative">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative card p-5 text-center"
          >
            <span className="absolute -top-3 -left-2 w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center shadow-card">
              {i + 1}
            </span>
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
              <s.icon className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-sm">{s.title}</h3>
            <p className="text-xs text-ink/50 mt-1.5 leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
