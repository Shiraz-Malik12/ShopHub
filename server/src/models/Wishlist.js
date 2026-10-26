import mongoose from 'mongoose'

export const MAX_WISHLIST_ITEMS = 100

// One wishlist per user (unique), like the cart. It only stores product
// ids: name, price and photo are always read from the product itself, so
// the wishlist never shows an old price.
const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // Oldest first — a newly saved product is added at the end.
    products: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], default: [] },
  },
  { timestamps: true },
)

export default mongoose.model('Wishlist', wishlistSchema)
