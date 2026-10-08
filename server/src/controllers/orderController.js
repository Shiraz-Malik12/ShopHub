import crypto from 'node:crypto'
import Order, { NEXT_STATUSES } from '../models/Order.js'
import Cart from '../models/Cart.js'
import Product from '../models/Product.js'

const ORDER_NUMBER_ATTEMPTS = 3

// e.g. "SH-261008-K7QX2": prefix, date (YYMMDD), 5 random characters.
// Letters/digits that look alike (0/O, 1/I) are left out so it's easy to
// read over the phone.
function generateOrderNumber() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const date = new Date().toISOString().slice(2, 10).replaceAll('-', '')
  const random = Array.from(crypto.randomBytes(5), (byte) => alphabet[byte % alphabet.length]).join('')
  return `SH-${date}-${random}`
}

// The order number is random, so two orders could (very rarely) get the
// same one. The unique index rejects the duplicate (error code 11000) and
// we simply try again with a new number.
async function createOrderWithNumber(data) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await Order.create({ ...data, orderNumber: generateOrderNumber() })
    } catch (err) {
      const duplicateNumber = err.code === 11000 && err.keyPattern?.orderNumber
      if (!duplicateNumber || attempt >= ORDER_NUMBER_ATTEMPTS) throw err
    }
  }
}

// Puts stock back (order cancelled, or placing the order failed half-way).
// Accepts cart items or order items — `product` may be a document or an id.
async function restock(items) {
  await Promise.all(
    items.map((item) =>
      Product.updateOne({ _id: item.product._id || item.product }, { $inc: { stock: item.quantity } }),
    ),
  )
}

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

// POST /api/orders  { shippingAddress }
// Turns the signed-in user's cart into an order. The items and prices come
// from the cart and the database — never from the request — so a client
// can't choose its own prices.
export async function placeOrder(req, res, next) {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price stock images isActive category',
      populate: { path: 'category', select: 'isActive' },
    })

    if (!cart || cart.items.length === 0) {
      throw fail(400, 'Your cart is empty.')
    }

    // 1. Check everything first, so the customer gets a clear message before
    //    anything is changed.
    for (const item of cart.items) {
      const product = item.product
      if (!product || !product.isActive || product.category?.isActive !== true) {
        throw fail(400, `${product?.name || 'A product'} is no longer available. Please remove it from your cart.`)
      }
      if (product.stock < item.quantity) {
        throw fail(
          400,
          product.stock === 0
            ? `${product.name} is out of stock. Please remove it from your cart.`
            : `Only ${product.stock} of ${product.name} left in stock. Please update your cart.`,
        )
      }
    }

    // 2. Take the stock. Each update only succeeds if enough stock is STILL
    //    there at that exact moment ($gte) — so two customers buying the last
    //    item at the same time can't both get it. If any step fails, the
    //    stock already taken for this order is put back.
    const reserved = []
    let order
    try {
      for (const item of cart.items) {
        const result = await Product.updateOne(
          { _id: item.product._id, isActive: true, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
        )
        if (result.modifiedCount === 0) {
          throw fail(409, `${item.product.name} just sold out or has too little stock left. Please review your cart.`)
        }
        reserved.push(item)
      }

      // 3. Save the order with a snapshot of each product as it is right now.
      const items = cart.items.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images[0]?.url || null,
        lineTotal: item.product.price * item.quantity,
      }))
      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)

      order = await createOrderWithNumber({
        user: req.user._id,
        items,
        shippingAddress: req.body.shippingAddress,
        paymentMethod: 'cod',
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        total: subtotal, // shipping is free for now
      })
    } catch (err) {
      await restock(reserved)
      throw err
    }

    // 4. The cart has become an order — empty it.
    cart.items = []
    await cart.save()

    res.status(201).json({ message: 'Order placed', order })
  } catch (err) {
    next(err)
  }
}

// GET /api/orders/mine — the signed-in user's own orders, newest first.
export async function listMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.status(200).json({ orders })
  } catch (err) {
    next(err)
  }
}

// GET /api/orders/admin?status=pending — admin-only, every customer's orders.
export async function listAllOrders(req, res, next) {
  try {
    const filter = {}
    if (req.query.status) filter.status = req.query.status

    const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 })
    res.status(200).json({ orders })
  } catch (err) {
    next(err)
  }
}

// GET /api/orders/:id — a customer can open only their OWN order; an admin
// can open any. Someone else's order answers 404 (not 403) so we don't
// even confirm that the order exists.
export async function getOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    const isOwner = order?.user?._id.equals(req.user._id)
    if (!order || (!isOwner && req.user.role !== 'admin')) {
      throw fail(404, 'Order not found.')
    }
    res.status(200).json({ order })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/orders/:id/cancel — a customer cancels their own order, only
// while it is still pending (nothing has been prepared or shipped yet).
export async function cancelMyOrder(req, res, next) {
  try {
    // Find + change in ONE step, and only if it is still pending: a double
    // click can't cancel twice (and give the stock back twice).
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'pending' },
      { status: 'cancelled' },
      { new: true },
    )

    if (!order) {
      const exists = await Order.exists({ _id: req.params.id, user: req.user._id })
      throw exists
        ? fail(400, 'This order can no longer be cancelled.')
        : fail(404, 'Order not found.')
    }

    await restock(order.items)
    res.status(200).json({ message: 'Order cancelled', order })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/orders/:id/status  { status } — admin moves an order forward
// (or cancels it). Only the moves listed in NEXT_STATUSES are allowed.
export async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body

    const current = await Order.findById(req.params.id)
    if (!current) {
      throw fail(404, 'Order not found.')
    }
    if (!NEXT_STATUSES[current.status].includes(status)) {
      throw fail(400, `An order that is ${current.status} cannot be changed to ${status}.`)
    }

    // Only apply the change if the status is still what we just read, so two
    // admins acting at once can't both move (or both cancel) the same order.
    const order = await Order.findOneAndUpdate(
      { _id: current._id, status: current.status },
      { status },
      { new: true },
    ).populate('user', 'name email')

    if (!order) {
      throw fail(409, 'This order was just updated by someone else. Please refresh.')
    }

    if (status === 'cancelled') {
      await restock(order.items)
    }

    res.status(200).json({ message: 'Order updated', order })
  } catch (err) {
    next(err)
  }
}
