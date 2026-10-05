import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import { customerVisibleFilter } from '../utils/customerVisibleFilter.js'

// Every user has at most one cart; it is created the first time it's needed.
// "Find it, or create it if missing" is done as ONE database operation
// (upsert), so two requests arriving at the same moment can't both create one.
async function getOrCreateCart(userId) {
  return Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { upsert: true, new: true },
  )
}

// A product can only be added if a customer could see it in the store.
async function findVisibleProduct(productId) {
  return Product.findOne({ _id: productId, ...(await customerVisibleFilter()) })
}

// Turns the stored cart (product ids + quantities) into what the frontend
// shows: full product info, a line total per item, and overall totals.
// Prices always come from the product, never from the cart.
async function buildCartResponse(cart) {
  await cart.populate({
    path: 'items.product',
    select: 'name price stock images isActive category',
    populate: { path: 'category', select: 'name slug isActive' },
  })

  const items = cart.items
    // A product that was hard-removed from the database leaves a null here.
    .filter((item) => item.product)
    .map((item) => {
      const { product, quantity } = item
      // Still in the cart, but hidden from the store since it was added
      // (product or its category deactivated) or sold out.
      const available = product.isActive && product.category?.isActive === true && product.stock > 0
      return {
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          image: product.images[0]?.url || null,
          category: product.category ? { name: product.category.name, slug: product.category.slug } : null,
        },
        quantity,
        lineTotal: product.price * quantity,
        available,
      }
    })

  // Unavailable items are shown (so the customer can remove them) but are
  // not counted in the totals — they can't be bought.
  const buyable = items.filter((item) => item.available)
  return {
    items,
    itemCount: buyable.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: buyable.reduce((sum, item) => sum + item.lineTotal, 0),
  }
}

function stockError(res, product) {
  return res.status(400).json({
    message:
      product.stock === 0
        ? `${product.name} is out of stock.`
        : `Only ${product.stock} of ${product.name} left in stock.`,
  })
}

// GET /api/cart
export async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id)
    res.status(200).json({ cart: await buildCartResponse(cart) })
  } catch (err) {
    next(err)
  }
}

// POST /api/cart/items  { productId, quantity? }
// Adding a product that is already in the cart increases its quantity.
export async function addCartItem(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body

    const product = await findVisibleProduct(productId)
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    const cart = await getOrCreateCart(req.user._id)
    const existing = cart.items.find((item) => item.product.equals(productId))
    const newQuantity = (existing?.quantity || 0) + quantity

    if (newQuantity > product.stock) {
      return stockError(res, product)
    }

    if (existing) {
      existing.quantity = newQuantity
    } else {
      cart.items.push({ product: productId, quantity })
    }
    await cart.save()

    res.status(200).json({ message: 'Added to cart', cart: await buildCartResponse(cart) })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/cart/items/:productId  { quantity }  — sets the exact quantity.
export async function updateCartItem(req, res, next) {
  try {
    const { productId } = req.params
    const { quantity } = req.body

    const cart = await getOrCreateCart(req.user._id)
    const item = cart.items.find((entry) => entry.product.equals(productId))
    if (!item) {
      return res.status(404).json({ message: 'This product is not in your cart.' })
    }

    const product = await findVisibleProduct(productId)
    if (!product) {
      return res.status(400).json({ message: 'This product is no longer available.' })
    }
    if (quantity > product.stock) {
      return stockError(res, product)
    }

    item.quantity = quantity
    await cart.save()

    res.status(200).json({ message: 'Cart updated', cart: await buildCartResponse(cart) })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/cart/items/:productId
export async function removeCartItem(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id)
    cart.items = cart.items.filter((item) => !item.product.equals(req.params.productId))
    await cart.save()

    res.status(200).json({ message: 'Removed from cart', cart: await buildCartResponse(cart) })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/cart
export async function clearCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id)
    cart.items = []
    await cart.save()

    res.status(200).json({ message: 'Cart cleared', cart: await buildCartResponse(cart) })
  } catch (err) {
    next(err)
  }
}
