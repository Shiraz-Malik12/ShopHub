import Product from '../models/Product.js'

// Puts stock back (order cancelled, payment page expired, or placing the
// order failed half-way). Accepts cart items or order items — `product`
// may be a document or an id.
export async function restock(items) {
  await Promise.all(
    items.map((item) =>
      Product.updateOne({ _id: item.product._id || item.product }, { $inc: { stock: item.quantity } }),
    ),
  )
}
