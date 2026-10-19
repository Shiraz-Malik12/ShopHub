import mongoose from 'mongoose'

export const MAX_PRODUCT_IMAGES = 5

// Only the image's *info* lives here — the actual file is stored on
// Cloudinary. `url` is what the browser loads; `publicId` is what we need
// to delete/replace the file on Cloudinary later. Each item keeps its own
// auto _id so the API can target one image (remove/replace) by id.
const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
})

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    isActive: { type: Boolean, default: true },
    // images[0] is the main image shown on the storefront list.
    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: (images) => images.length <= MAX_PRODUCT_IMAGES,
        message: `A product can have at most ${MAX_PRODUCT_IMAGES} images`,
      },
    },
    // A summary of this product's reviews, kept up to date whenever a review
    // is added, changed or removed (see reviewController.updateProductRating).
    // Stored here so the shop can show stars and sort by rating without
    // reading every review of every product.
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
)

export default mongoose.model('Product', productSchema)
