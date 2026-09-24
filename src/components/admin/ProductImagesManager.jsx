import { useRef, useState } from 'react'
import { App as AntdApp, Button, Empty, Popconfirm, Tag } from 'antd'
import * as productApi from '../../api/productApi'
import { ALLOWED_TYPES, MAX_FILE_SIZE_MB, MAX_IMAGES, validateImageFiles } from './productImageRules'

// Manages the images of an *existing* product. Every action (add, replace,
// remove) calls the API immediately — it is not tied to the form's Save
// button — and hands the updated product back through onProductUpdated.
export default function ProductImagesManager({ product, onProductUpdated }) {
  const [busy, setBusy] = useState(false)
  const addInputRef = useRef(null)
  const replaceInputRef = useRef(null)
  const replacingImageIdRef = useRef(null)
  const { message } = AntdApp.useApp()

  const images = product.images || []
  const remaining = MAX_IMAGES - images.length

  async function runAction(request, successText) {
    setBusy(true)
    try {
      const { data } = await request()
      onProductUpdated(data.product)
      message.success(successText)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function handleAddFiles(event) {
    const files = Array.from(event.target.files)
    // Reset so picking the same file again still fires onChange.
    event.target.value = ''
    if (files.length === 0) return message.warning('Please select at least one image.')
    if (files.length > remaining) return message.error(`You can add ${remaining} more image(s).`)
    const error = validateImageFiles(files)
    if (error) return message.error(error)
    runAction(() => productApi.uploadProductImages(product._id, files), 'Images uploaded')
  }

  function openReplacePicker(imageId) {
    replacingImageIdRef.current = imageId
    replaceInputRef.current.click()
  }

  function handleReplaceFile(event) {
    const [file] = event.target.files
    event.target.value = ''
    if (!file) return
    const error = validateImageFiles([file])
    if (error) return message.error(error)
    runAction(
      () => productApi.replaceProductImage(product._id, replacingImageIdRef.current, file),
      'Image replaced',
    )
  }

  return (
    <div>
      <input ref={addInputRef} type="file" accept={ALLOWED_TYPES.join(',')} multiple hidden onChange={handleAddFiles} />
      <input ref={replaceInputRef} type="file" accept={ALLOWED_TYPES.join(',')} hidden onChange={handleReplaceFile} />

      {images.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No images yet" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <div key={image._id} className="rounded-lg border border-slate-200 p-2">
              <img src={image.url} alt={`${product.name} ${index + 1}`} className="h-36 w-full rounded object-cover" />
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {index === 0 && <Tag color="blue">Main</Tag>}
                <Button size="small" disabled={busy} onClick={() => openReplacePicker(image._id)}>Replace</Button>
                <Popconfirm
                  title="Remove this image?"
                  okText="Remove"
                  onConfirm={() => runAction(() => productApi.removeProductImage(product._id, image._id), 'Image removed')}
                >
                  <Button size="small" danger disabled={busy}>Remove</Button>
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">
          {images.length}/{MAX_IMAGES} · JPG, PNG or WebP · max {MAX_FILE_SIZE_MB} MB each · changes save immediately
        </span>
        <Button loading={busy} disabled={remaining <= 0} onClick={() => addInputRef.current.click()}>
          Add images
        </Button>
      </div>
    </div>
  )
}
