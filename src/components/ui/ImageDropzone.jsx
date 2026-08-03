import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { safeImageUrl } from '../../utils/sanitize'

/**
 * Image URL field with drag-and-drop + live preview.
 *
 * There is no file-upload endpoint on the backend (the product API only
 * accepts an `image` URL string), so dropping/pasting a real image URL (e.g.
 * dragged from another browser tab) fills the field for real. Dropping a
 * local file only shows a temporary local preview - it deliberately does NOT
 * write a blob: URL into the field, since that would silently break the
 * moment the page reloads or anyone else views it.
 */
export default function ImageDropzone({ value, onChange, placeholder = 'https://...' }) {
  const [dragOver, setDragOver] = useState(false)
  const [localPreview, setLocalPreview] = useState(null)
  const inputRef = useRef(null)

  const handleFiles = (files) => {
    const file = files?.[0]
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setLocalPreview(url)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    const safeUrl = safeImageUrl(url)
    if (safeUrl) {
      onChange(safeUrl)
      setLocalPreview(null)
      return
    }
    handleFiles(e.dataTransfer.files)
  }

  const previewSrc = localPreview || safeImageUrl(value) || null

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-4 flex items-center gap-3 cursor-pointer transition-colors ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-black/10 hover:border-primary-300'}`}
      >
        {previewSrc ? (
          <div className="relative shrink-0">
            <img src={previewSrc} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
            {localPreview && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLocalPreview(null) }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white shadow-soft flex items-center justify-center text-ink/50 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg bg-primary-50 text-primary-400 flex items-center justify-center shrink-0">
            <ImagePlus className="w-6 h-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink/70">Drag & drop an image here</p>
          <p className="text-xs text-ink/40 mt-0.5">
            {localPreview ? 'Local preview only - paste a hosted image URL below to save it' : 'Or drag an image URL from another tab, or paste one below'}
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        type="url"
        value={value}
        onChange={(e) => { onChange(e.target.value); setLocalPreview(null) }}
        placeholder={placeholder}
        className="input-field mt-2"
      />
    </div>
  )
}
