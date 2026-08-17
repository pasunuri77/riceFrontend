import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Target, Eye, Leaf, Users } from 'lucide-react'
import Breadcrumb from '../../components/ui/Breadcrumb'
import brandApi from '../../api/brandApi'

const VALUES = [
  { icon: Leaf, title: 'Farm-Fresh Sourcing', desc: 'We work directly with trusted mills to bring authentic Sona Masoori rice to your door.' },
  { icon: Target, title: 'Quality First', desc: 'Every batch is quality-checked before it reaches your kitchen or store shelf.' },
  { icon: Users, title: 'Customer Obsessed', desc: 'From individuals to bulk business buyers, we tailor service to your needs.' },
  { icon: Eye, title: 'Transparency', desc: 'Clear pricing, honest descriptions, and no hidden charges — ever.' },
]

export default function About() {
  const [brands, setBrands] = useState([])

  useEffect(() => {
    brandApi.list().then(setBrands).catch(() => setBrands([]))
  }, [])

  return (
    <div className="container-app py-10">
      <Breadcrumb items={[{ label: 'About Us' }]} />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-2 gap-10 items-center mb-16">
        <div>
          <span className="badge bg-primary-100 text-primary-700 mb-4">Our Story</span>
          <h1 className="section-title !text-4xl">Bringing Authentic Sona Masoori Rice to Austin</h1>
          <p className="text-ink/60 mt-4 leading-relaxed">
            RiceBazaar started with a simple idea — make premium, authentic Sona Masoori rice accessible to everyone in Austin, whether you're cooking for a family of four or running a restaurant. You can shop with us online for delivery across selected areas of the Greater Austin region, or visit our North Austin store in person - we partner with {brands.length} trusted brands to serve both individual households and business customers.
          </p>
          <p className="text-ink/60 mt-3 leading-relaxed">
            We believe great meals start with great rice — and we're committed to quality, fair pricing, and reliable delivery, every single time.
          </p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1627482265910-5c0ff6bee088?w=800&h=600&fit=crop&q=80"
          alt="Premium rice on a wooden table"
          className="rounded-2xl2 shadow-cardHover w-full object-cover aspect-[4/3]"
        />
      </motion.div>

      <div className="mb-16">
        <h2 className="section-title text-center">Our Values</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          {VALUES.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card p-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-leaf-50 text-leaf-600 flex items-center justify-center mx-auto mb-3">
                <v.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm">{v.title}</h3>
              <p className="text-xs text-ink/50 mt-1.5 leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 text-center">
        <div className="card p-6"><p className="text-3xl font-extrabold font-display text-primary-700">2026</p><p className="text-xs text-ink/50 mt-1">Founded</p></div>
        <div className="card p-6"><p className="text-3xl font-extrabold font-display text-primary-700">{brands.length}</p><p className="text-xs text-ink/50 mt-1">Brands</p></div>
      </div>
    </div>
  )
}
