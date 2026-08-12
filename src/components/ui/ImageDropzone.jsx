import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { safeImageUrl } from '../../utils/sanitize'
import productApi from '../../api/productApi'
import { ApiError } from '../../api/client'

/**
 * Image URL field with drag-and-drop + live preview.
 *
 * Dropping/pasting a real image URL (e.g. dragged from another browser tab)
 * fills the field directly. Dropping/selecting a local file uploads it via
 * the real POST /api/admin/products/upload-image endpoint (Cloudinary-backed)
 * and uses the hosted URL it returns - never a local blob: URL, which would
 * silently break the moment the page reloads or anyone else views it.
 */
export default function ImageDropzone({ value, onChange, placeholder = 'https://...' }) {
  const [dragOver, setDragOver] = useState(false)
  const [localPreview, setLocalPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const inputRef = useRef(null)

  const handleFiles = (files) => {
    const file = files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    const localUrl = URL.createObjectURL(file)
    setLocalPreview(localUrl)
    setUploadError(null)
    setUploading(true)

    productApi.uploadImage(file)
      .then((res) => {
        onChange(res.url)
      })
      .catch((err) => {
        setUploadError(err instanceof ApiError ? err.message : 'Upload failed')
      })
      .finally(() => {
        setUploading(false)
        setLocalPreview(null)
        URL.revokeObjectURL(localUrl)
      })
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
            {uploading && (
              <span className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </span>
            )}
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg bg-primary-50 text-primary-400 flex items-center justify-center shrink-0">
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink/70">Drag & drop an image here</p>
          <p className="text-xs text-ink/40 mt-0.5">
            {uploading ? 'Uploading...' : uploadError ? uploadError : 'Or drag an image URL from another tab, or paste one below'}
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
