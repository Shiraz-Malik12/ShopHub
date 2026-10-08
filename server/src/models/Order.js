import mongoose from 'mongoose'

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

// Which status an order may move to next. An order only moves forward;
// 'delivered' and 'cancelled' are final. Once shipped it can no longer be
// cancelled (the parcel has already left).
export const NEXT_STATUSES = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

// A SNAPSHOT of the product at the moment of purchase. Unlike the cart
// (which stores only a product id and always reads the latest price), an
// order copies the name, price and image — so if the admin later renames
// the product, changes its price, or hides it, this order still shows
// exactly what the customer bought and paid.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: null },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    addressLine: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 20, default: '' },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    // Short, human-friendly reference shown to the customer (e.g. on the
    // confirmation page) — easier to read out than a MongoDB id.
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (items) => items.length > 0, message: 'An order needs at least one item' },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    // Only cash on delivery for now; online payment will add more options.
    paymentMethod: { type: String, enum: ['cod'], default: 'cod' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    itemCount: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
)

export default mongoose.model('Order', orderSchema)
