import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Download } from 'lucide-react'
import { createPortal } from 'react-dom'

// Full-size view of a photo already shown as a thumbnail elsewhere (delivery
// proof, etc.) - the download button fetches the image as a blob rather than
// a plain <a download> so it still works for a cross-origin Cloudinary URL
// (a bare download attribute is ignored by the browser for cross-origin
// links; only same-origin blob: URLs are guaranteed to trigger a save).
export default function ImageLightbox({ open, onClose, src, alt = 'Photo', downloadName = 'photo.jpg' }) {
  const [downloading, setDownloading] = useState(false)

  const download = async () => {
    setDownloading(true)
    try {
      const res = await fetch(src)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // Cross-origin fetch blocked or offline - fall back to opening the
      // image directly so the user can still save it manually.
      window.open(src, '_blank', 'noopener,noreferrer')
    } finally {
      setDownloading(false)
    }
  }

  if (typeof document === 'undefined' || !src) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
          onClick={onClose}
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); download() }}
              disabled={downloading}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full px-4 py-2 text-sm font-semibold backdrop-blur disabled:opacity-60"
            >
              <Download className="w-4 h-4" /> {downloading ? 'Downloading...' : 'Download'}
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 backdrop-blur">
              <X className="w-5 h-5" />
            </button>
          </div>
          <motion.img
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
