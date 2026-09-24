import Product, { MAX_PRODUCT_IMAGES } from '../models/Product.js'
import { uploadImageBuffer, deleteImage, deleteImages } from '../utils/cloudinaryUpload.js'

// Uploads every buffer to Cloudinary. If any one fails, the ones that did
// succeed are deleted again so a half-finished batch never leaves orphans.
async function uploadAll(files) {
  const results = await Promise.allSettled(files.map((file) => uploadImageBuffer(file)))
  const uploaded = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
  const failed = results.find((r) => r.status === 'rejected')
  if (failed) {
    await deleteImages(uploaded.map((image) => image.publicId))
    throw failed.reason
  }
  return uploaded
}

export async function addProductImages(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please select at least one image.' })
    }

    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    // Checked before uploading so we never pay for (then delete) uploads
    // that were always going to be rejected.
    if (product.images.length + req.files.length > MAX_PRODUCT_IMAGES) {
      const remaining = MAX_PRODUCT_IMAGES - product.images.length
      return res.status(400).json({
        message: `A product can have at most ${MAX_PRODUCT_IMAGES} images. You can add ${remaining} more.`,
      })
    }

    const uploaded = await uploadAll(req.files)

    try {
      product.images.push(...uploaded)
      await product.save()
    } catch (err) {
      // Cloudinary has the files but MongoDB doesn't know about them —
      // remove them so they don't sit there unused forever.
      await deleteImages(uploaded.map((image) => image.publicId))
      throw err
    }

    await product.populate('category', 'name slug isActive')
    res.status(200).json({ message: 'Images uploaded', product })
  } catch (err) {
    next(err)
  }
}

export async function replaceProductImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please select an image.' })
    }

    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    const image = product.images.id(req.params.imageId)
    if (!image) {
      return res.status(404).json({ message: 'Image not found.' })
    }

    const oldPublicId = image.publicId
    const uploaded = await uploadImageBuffer(req.file)

    try {
      // Swapping url/publicId in place keeps the image's position (and _id),
      // so replacing the main image keeps it the main image.
      image.url = uploaded.url
      image.publicId = uploaded.publicId
      await product.save()
    } catch (err) {
      await deleteImage(uploaded.publicId)
      throw err
    }

    // Only after the database points at the new image is the old file removed.
    await deleteImage(oldPublicId)

    await product.populate('category', 'name slug isActive')
    res.status(200).json({ message: 'Image replaced', product })
  } catch (err) {
    next(err)
  }
}

export async function removeProductImage(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    const image = product.images.id(req.params.imageId)
    if (!image) {
      return res.status(404).json({ message: 'Image not found.' })
    }

    const { publicId } = image
    image.deleteOne()
    await product.save()

    // Database first, Cloudinary second: if this delete fails the product is
    // still correct, and the only cost is one unused file on Cloudinary.
    await deleteImage(publicId)

    await product.populate('category', 'name slug isActive')
    res.status(200).json({ message: 'Image removed', product })
  } catch (err) {
    next(err)
  }
}
