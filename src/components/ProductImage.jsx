import { useState } from 'react'
import { PictureOutlined } from '@ant-design/icons'

// Shows a product image, or a neutral placeholder when there is no image or
// the URL is broken (deleted file, network error). Used everywhere a
// product picture appears, so a missing image never breaks the layout.
// `compact`: icon only, for small thumbnails where the label would not fit.
export default function ProductImage({ src, alt, className = '', fit = 'cover', compact = false }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 bg-slate-800 text-slate-500 ${className}`}>
        <PictureOutlined className={compact ? 'text-base' : 'text-2xl'} />
        {!compact && <span className="text-xs">No image</span>}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
    />
  )
}
