import mongoose from 'mongoose'

export const MAX_ITEM_QUANTITY = 99

// One line in the cart: which product, and how many. The price is NOT
// stored here — it is always read from the product itself, so the cart
// can never show an outdated price.
const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, max: MAX_ITEM_QUANTITY, validate: Number.isInteger },
  },
  { _id: false },
)

// One cart per user (unique) — it lives in the database, so it survives
// closing the browser and is the same on every device the user signs in on.
const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
)

export default mongoose.model('Cart', cartSchema)
