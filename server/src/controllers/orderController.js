import crypto from 'node:crypto'
import mongoose from 'mongoose'
import Order, { NEXT_STATUSES } from '../models/Order.js'
import Shop from '../models/Shop.js'
import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import { checkoutForEmail, sendInBackground, sendOrderPlacedEmail, sendOrderStatusEmail } from '../utils/orderEmails.js'
import { restock } from '../utils/orderStock.js'
import { isStripeConfigured, MIN_CARD_AMOUNT } from '../utils/stripe.js'
import { createCheckoutSession, handleCancelledOrderPayment } from '../utils/payments.js'
import { checkCoupon, claimCouponUse, releaseCouponForCheckout, releaseCouponUse, subtotalsByShop } from '../utils/coupons.js'
import { shopScopeOf } from '../middleware/shopScope.js'
import { isFromSellingShop, sellingShopIds } from '../utils/customerVisibleFilter.js'

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

// Saves all the orders of one checkout (one per shop) under a shared number:
//   one shop  → "SH-261113-K7QX2"
//   two shops → "SH-261113-K7QX2-A" and "SH-261113-K7QX2-B"
// The number is random, so it could (very rarely) be taken already. Then
// every order saved in this attempt is removed again and we retry with a
// new number — a checkout is saved completely or not at all.
async function createCheckoutOrders(parts) {
  for (let attempt = 1; ; attempt += 1) {
    const checkoutId = generateOrderNumber()
    if (await Order.exists({ checkoutId })) continue
    const docs = parts.map((part, index) => ({
      ...part,
      _id: new mongoose.Types.ObjectId(), // known up front, so a failed attempt can be undone exactly
      checkoutId,
      orderNumber: parts.length === 1 ? checkoutId : `${checkoutId}-${String.fromCharCode(65 + index)}`,
    }))
    try {
      return await Order.insertMany(docs, { ordered: true })
    } catch (err) {
      await Order.deleteMany({ _id: { $in: docs.map((doc) => doc._id) } })
      const duplicateNumber = err.code === 11000 || err.writeErrors?.some((writeError) => writeError.code === 11000)
      if (!duplicateNumber || attempt >= ORDER_NUMBER_ATTEMPTS) throw err
    }
  }
}

// Splits one discount between several orders in proportion to their
// subtotals, in cents, so the parts always add up to exactly the discount.
// e.g. $10 off a $60 + $40 cart → $6 and $4. The last part takes whatever
// cents rounding left over.
export function splitDiscount(discount, subtotals) {
  const total = subtotals.reduce((sum, value) => sum + value, 0)
  let given = 0
  return subtotals.map((subtotal, index) => {
    if (index === subtotals.length - 1) return Math.round((discount - given) * 100) / 100
    const share = total > 0 ? Math.round(((discount * subtotal) / total) * 100) / 100 : 0
    given += share
    return share
  })
}

// Cart lines → one group per shop, in the order the shops first appear.
function groupCartByShop(items) {
  const groups = new Map()
  for (const item of items) {
    const shopId = String(item.product.shop)
    if (!groups.has(shopId)) groups.set(shopId, [])
    groups.get(shopId).push(item)
  }
  return groups
}

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

// POST /api/orders  { shippingAddress, saveAddress?, couponCode?, paymentMethod? }
// Turns the signed-in user's cart into an order. The items and prices come
// from the cart and the database — never from the request — so a client
// can't choose its own prices.
// paymentMethod 'card': the orders are saved as "awaiting payment" and the
// answer includes `paymentUrl`, Stripe's payment page to send the customer to.
export async function placeOrder(req, res, next) {
  try {
    const paymentMethod = req.body.paymentMethod || 'cod'
    // Checked before anything is reserved, so a shop without Stripe keys
    // never leaves an order stuck waiting for a payment it can't take.
    if (paymentMethod === 'card' && !isStripeConfigured()) {
      throw fail(503, 'Card payments are not available right now. Please choose cash on delivery.')
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price stock images isActive category shop',
      populate: { path: 'category', select: 'isActive' },
    })
    const shopIds = await sellingShopIds()

    if (!cart || cart.items.length === 0) {
      throw fail(400, 'Your cart is empty.')
    }

    // 1. Check everything first, so the customer gets a clear message before
    //    anything is changed.
    for (const item of cart.items) {
      const product = item.product
      // Also refused if its shop was suspended (or its owner blocked) after
      // it went into the cart.
      if (!product || !product.isActive || product.category?.isActive !== true || !isFromSellingShop(product, shopIds)) {
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

    // A coupon code was entered: check it now, against the REAL subtotal
    // from the database. The discount is calculated here, never in the browser.
    // couponShopId: set when it's a SHOP's coupon — then only that shop's
    // part of the order gets the discount.
    let coupon = null
    let discount = 0
    let couponShopId = null
    if (req.body.couponCode) {
      const shopTotals = subtotalsByShop(
        cart.items.map((item) => ({ shopId: item.product.shop, lineTotal: item.product.price * item.quantity })),
      )
      const checked = await checkCoupon(req.body.couponCode, { shopTotals, userId: req.user._id })
      if (checked.error) throw fail(400, checked.error)
      ;({ coupon, discount, shopId: couponShopId } = checked)
    }

    // Stripe can't take a card payment under $0.50 (e.g. a big coupon).
    const cartTotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) - discount
    if (paymentMethod === 'card' && cartTotal < MIN_CARD_AMOUNT) {
      throw fail(400, 'This order is too small to pay by card. Please choose cash on delivery.')
    }

    // 2. Take the stock. Each update only succeeds if enough stock is STILL
    //    there at that exact moment ($gte) — so two customers buying the last
    //    item at the same time can't both get it. If any step fails, the
    //    stock already taken for this order is put back.
    const reserved = []
    let couponClaimed = false
    let orders
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

      // Take one use of the coupon — fails if someone just used the last one.
      if (coupon) {
        couponClaimed = await claimCouponUse(coupon)
        if (!couponClaimed) throw fail(409, 'This coupon was just used up. Please remove it and try again.')
      }

      // 3. Save ONE ORDER PER SHOP, each with a snapshot of its products as
      //    they are right now. The coupon's discount is shared between them.
      const groups = groupCartByShop(cart.items)
      const shops = await Shop.find({ _id: { $in: [...groups.keys()] } }).select('name')
      const shopNameById = new Map(shops.map((shop) => [String(shop._id), shop.name]))

      const parts = [...groups].map(([shopId, shopItems]) => {
        const items = shopItems.map((item) => ({
          product: item.product._id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.images[0]?.url || null,
          lineTotal: item.product.price * item.quantity,
        }))
        return { shopId, items, subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0) }
      })
      // A site-wide coupon is shared fairly between the shops; a shop's
      // coupon goes entirely to that shop's order (the others get nothing).
      const discounts = couponShopId
        ? parts.map((part) => (part.shopId === couponShopId ? discount : 0))
        : splitDiscount(discount, parts.map((part) => part.subtotal))
      // The coupon is recorded only on the orders it took money off.
      const couponSnapshot = coupon ? { code: coupon.code, type: coupon.type, value: coupon.value } : undefined
      const couponFor = (part) => (couponSnapshot && (!couponShopId || part.shopId === couponShopId) ? couponSnapshot : undefined)

      orders = await createCheckoutOrders(
        parts.map((part, index) => {
          // Shipping is free for now. Rounded to cents (e.g. 10% of $18.99).
          const total = Math.round((part.subtotal - discounts[index]) * 100) / 100
          return {
            user: req.user._id,
            shop: part.shopId,
            shopName: shopNameById.get(part.shopId) || 'Unknown shop',
            items: part.items,
            shippingAddress: req.body.shippingAddress,
            paymentMethod,
            // A card order waits for Stripe. (A part a coupon made free has
            // nothing to pay, so it counts as paid straight away.)
            paymentStatus: paymentMethod === 'cod' ? 'cod' : total > 0 ? 'awaiting' : 'paid',
            paidAt: paymentMethod === 'card' && total === 0 ? new Date() : undefined,
            itemCount: part.items.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: part.subtotal,
            discount: discounts[index],
            coupon: couponFor(part),
            total,
          }
        }),
      )
    } catch (err) {
      await restock(reserved)
      if (couponClaimed) await releaseCouponUse(coupon.code)
      throw err
    }

    // 4. The cart has become an order — empty it.
    cart.items = []
    await cart.save()

    // 5. "Save this address for next time" was ticked: remember it on the
    //    account so checkout is filled in for them next time.
    if (req.body.saveAddress === true) {
      const { fullName, phone, addressLine, city, postalCode = '' } = orders[0].shippingAddress
      await User.updateOne({ _id: req.user._id }, { savedAddress: { fullName, phone, addressLine, city, postalCode } })
    }

    // 6a. Cash on delivery: one "order confirmed" email for the whole
    //     checkout (in the background — never delays or breaks the order).
    if (paymentMethod === 'cod') {
      sendInBackground(sendOrderPlacedEmail(checkoutForEmail(orders), req.user))
      // `order` (the first one) is kept so older screens still find an order.
      return res.status(201).json({ message: 'Order placed', checkoutId: orders[0].checkoutId, order: orders[0], orders })
    }

    // 6b. Card: open Stripe's payment page. The "confirmed" email waits until
    //     Stripe says it's paid (see utils/payments.js). If Stripe can't be
    //     reached right now, the order still exists and the customer can try
    //     again with "Pay now" on the order page.
    let paymentUrl = null
    let paymentError = null
    try {
      paymentUrl = await createCheckoutSession(
        orders.filter((order) => order.paymentStatus === 'awaiting'),
        req.user,
      )
    } catch (err) {
      console.error('[payments] Could not open the payment page:', err.message)
      paymentError = 'We could not open the payment page. Please try "Pay now" on your order.'
    }
    res.status(201).json({
      message: 'Order placed — waiting for payment',
      checkoutId: orders[0].checkoutId,
      order: orders[0],
      orders,
      paymentUrl,
      paymentError,
    })
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

// GET /api/orders/admin?status=pending — admin: every shop's orders.
// GET /api/seller/orders?status=pending — seller: only their own shop's.
// (The scope comes from middleware/shopScope.js.)
export async function listAllOrders(req, res, next) {
  try {
    const filter = { ...shopScopeOf(req) }
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
    // The other parcels of the same checkout (other shops), so the page can
    // say "this purchase came in 2 parcels" and link to the rest.
    const siblings = await Order.find({ checkoutId: order.checkoutId, _id: { $ne: order._id } })
      .sort({ orderNumber: 1 })
      .select('orderNumber shopName status total itemCount paymentStatus')
    res.status(200).json({ order, siblings })
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
    await releaseCouponForCheckout(order) // the coupon comes back once the whole checkout is cancelled
    // Paid by card → refund it; still waiting for payment → close the payment page.
    await handleCancelledOrderPayment(order)
    const updated = await Order.findById(order._id)
    sendInBackground(sendOrderStatusEmail(updated, req.user))
    res.status(200).json({ message: 'Order cancelled', order: updated })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/orders/:id/status  { status } — admin, any shop's order.
// PATCH /api/seller/orders/:id/status — seller, only their own shop's order
// (another shop's order is simply "not found").
// Moves an order forward (or cancels it); only the moves in NEXT_STATUSES.
export async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body

    const current = await Order.findOne({ _id: req.params.id, ...shopScopeOf(req) })
    if (!current) {
      throw fail(404, 'Order not found.')
    }
    if (!NEXT_STATUSES[current.status].includes(status)) {
      throw fail(400, `An order that is ${current.status} cannot be changed to ${status}.`)
    }
    // A card order is only packed and sent once Stripe confirmed the money.
    // (Cancelling it is always allowed.)
    if (current.paymentStatus === 'awaiting' && status !== 'cancelled') {
      throw fail(409, "This order hasn't been paid yet. Wait for the payment before preparing it.")
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

    let result = order
    if (status === 'cancelled') {
      await restock(order.items)
      await releaseCouponForCheckout(order)
      // Paid by card → refund this shop's part; unpaid → close the payment page.
      await handleCancelledOrderPayment(order)
      result = await Order.findById(order._id).populate('user', 'name email')
    }

    // Tell the customer (skipped if their account no longer exists).
    if (result.user?.email) {
      sendInBackground(sendOrderStatusEmail(result, result.user))
    }

    res.status(200).json({ message: 'Order updated', order: result })
  } catch (err) {
    next(err)
  }
}
