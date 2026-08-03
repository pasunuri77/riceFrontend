import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import Breadcrumb from '../../components/ui/Breadcrumb'
import FormField from '../../components/ui/FormField'
import SubmitButton from '../../components/ui/SubmitButton'
import { useToast } from '../../context/ToastContext'
import contactApi from '../../api/contactApi'

const MESSAGE_MAX = 2000
const SUBJECT_MAX = 150

const schema = z.object({
  name: z.string().min(1, 'Your name is required').max(100, 'Name is too long'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address').max(150),
  subject: z.string().min(1, 'Subject is required').max(SUBJECT_MAX, `Subject must be under ${SUBJECT_MAX} characters`),
  message: z.string().min(1, 'Message is required').max(MESSAGE_MAX, `Message must be under ${MESSAGE_MAX} characters`),
})

export default function Contact() {
  const { showToast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', subject: '', message: '' },
  })

  const subject = watch('subject')
  const message = watch('message')

  const onSubmit = async (data) => {
    try {
      await contactApi.sendMessage(data)
      showToast('Message sent! Our team will get back to you soon.', 'success')
      reset()
    } catch (err) {
      showToast(err.message || 'Unable to send message. Please try again.', 'error')
    }
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Your Name" error={errors.name?.message}>
                <input {...register('name')} autoFocus className="input-field" aria-invalid={!!errors.name} />
              </FormField>
              <FormField label="Email Address" error={errors.email?.message}>
                <input {...register('email')} type="email" className="input-field" aria-invalid={!!errors.email} />
              </FormField>
            </div>
            <FormField label="Subject" error={errors.subject?.message} maxLength={SUBJECT_MAX} currentLength={subject?.length}>
              <input {...register('subject')} className="input-field" aria-invalid={!!errors.subject} />
            </FormField>
            <FormField label="Message" error={errors.message?.message} maxLength={MESSAGE_MAX} currentLength={message?.length}>
              <textarea {...register('message')} rows={5} className="input-field" aria-invalid={!!errors.message} />
            </FormField>
            <SubmitButton loading={isSubmitting} loadingLabel="Sending..." className="btn-primary w-full sm:w-auto">
              <Send className="w-4 h-4" /> Send Message
            </SubmitButton>
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
