import Order from '../models/Order.js'
import User from '../models/User.js'
import { getStripe, toCents } from './stripe.js'
import { restock } from './orderStock.js'
import { releaseCouponForCheckout } from './coupons.js'
import { checkoutForEmail, sendInBackground, sendOrderPlacedEmail } from './orderEmails.js'

// Everything about card payments in one place. The big rule: an order is
// only "paid" when STRIPE says so — through the webhook (Stripe's server
// calling ours) or our server asking Stripe directly. Never because the
// browser says "success": that page can be faked or closed early.
//
// One Stripe Checkout Session pays for the whole checkout (every shop's
// order together); each shop's order is one line on Stripe's payment page.

// How long the payment page stays open. Stock is held for the order in the
// meantime; when it expires, the order is cancelled and the stock comes back.
// (Stripe's minimum is 30 minutes.)
const PAYMENT_WINDOW_MINUTES = 35

function clientUrl(path) {
  return `${process.env.CLIENT_URL}${path}`
}

// Opens Stripe's payment page for the given (unpaid) orders of ONE checkout
// and returns its address. Any older payment page for these orders is
// closed first, so the customer can never pay twice.
export async function createCheckoutSession(orders, customer) {
  const stripe = getStripe()
  const { checkoutId } = orders[0]

  // A "Pay now" retry: close the old page. If it turns out it WAS just paid,
  // record that instead of opening a second page.
  const oldSessionId = orders[0].stripe?.checkoutSessionId
  if (oldSessionId) {
    const old = await stripe.checkout.sessions.retrieve(oldSessionId)
    if (old.payment_status === 'paid') {
      await markCheckoutPaid(old)
      return null
    }
    if (old.status === 'open') await expireSessionQuietly(oldSessionId)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customer.email,
    client_reference_id: String(customer._id),
    // One line per shop's order, priced from OUR database (discount included).
    line_items: orders.map((order) => ({
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: toCents(order.total),
        product_data: {
          name: `Order ${order.orderNumber}`,
          description: `${order.itemCount} ${order.itemCount === 1 ? 'item' : 'items'} from ${order.shopName}`,
        },
      },
    })),
    // Lets the webhook find the orders again.
    metadata: { checkoutId },
    payment_intent_data: { metadata: { checkoutId } },
    success_url: clientUrl(`/orders/${orders[0]._id}?payment=success`),
    cancel_url: clientUrl(`/orders/${orders[0]._id}?payment=cancelled`),
    expires_at: Math.floor(Date.now() / 1000) + PAYMENT_WINDOW_MINUTES * 60,
  })

  // Remember which page pays for which orders.
  await Order.updateMany(
    { _id: { $in: orders.map((order) => order._id) } },
    { $set: { 'stripe.checkoutSessionId': session.id } },
  )
  return session.url
}

// Closes a payment page we no longer want. The orders stay linked to it (so
// a payment that slips through at the same moment is still recorded), but
// are marked "closed on purpose", so the "expired" message Stripe then sends
// doesn't cancel them. Never throws: if the page is already closed, fine.
async function expireSessionQuietly(sessionId) {
  await Order.updateMany({ 'stripe.checkoutSessionId': sessionId }, { $set: { 'stripe.closedSessionId': sessionId } })
  try {
    await getStripe().checkout.sessions.expire(sessionId)
  } catch (err) {
    console.warn(`[payments] Could not close payment page ${sessionId}: ${err.message}`)
  }
}

// Stripe confirmed a payment page as paid (webhook, or our own check).
// Safe to call more than once: only orders still "awaiting" change.
export async function markCheckoutPaid(session) {
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
  const ofThisPage = { 'stripe.checkoutSessionId': session.id }

  const awaiting = await Order.find({ ...ofThisPage, paymentStatus: 'awaiting' })
  if (awaiting.length > 0) {
    await Order.updateMany(
      { _id: { $in: awaiting.map((order) => order._id) }, paymentStatus: 'awaiting' },
      { $set: { paymentStatus: 'paid', paidAt: new Date(), 'stripe.paymentIntentId': paymentIntentId } },
    )
    // Now the order is really confirmed — send the "order confirmed" email.
    const paid = await Order.find({ _id: { $in: awaiting.map((order) => order._id) } }).sort({ orderNumber: 1 })
    const customer = await User.findById(paid[0].user).select('name email')
    if (customer) sendInBackground(sendOrderPlacedEmail(checkoutForEmail(paid), customer))
  }

  // Rare race: a part was cancelled while the customer was on the payment
  // page, and they paid anyway. That part's money goes straight back.
  const cancelledMeanwhile = await Order.find({ ...ofThisPage, status: 'cancelled', paymentStatus: 'unpaid' })
  for (const order of cancelledMeanwhile) {
    order.paymentStatus = 'paid'
    order.stripe.paymentIntentId = paymentIntentId
    await refundOrder(order)
  }
}

// The payment page expired (or the payment failed) without being paid:
// cancel those orders and put their stock back, like a customer cancel.
// Pages WE closed on purpose (closedSessionId) are skipped — those orders
// are still waiting for the customer's "Pay now".
export async function expireCheckout(session) {
  const orders = await Order.find({
    'stripe.checkoutSessionId': session.id,
    'stripe.closedSessionId': { $ne: session.id },
    paymentStatus: 'awaiting',
    status: 'pending',
  })
  for (const order of orders) {
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: 'awaiting', status: 'pending' },
      { $set: { status: 'cancelled', paymentStatus: 'unpaid' } },
      { new: true },
    )
    if (!updated) continue // someone else changed it at the same moment
    await restock(updated.items)
    await releaseCouponForCheckout(updated)
  }
}

// Gives this order's money back (only this shop's part of the payment).
// The idempotency key makes Stripe refund at most once, even if this runs
// twice. A failed refund is recorded so the admin can sort it out.
export async function refundOrder(order) {
  if (order.paymentStatus !== 'paid' || !order.stripe?.paymentIntentId || order.total <= 0) {
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded' // nothing was actually charged for it
      await order.save()
    }
    return
  }
  try {
    const refund = await getStripe().refunds.create(
      { payment_intent: order.stripe.paymentIntentId, amount: toCents(order.total), metadata: { orderNumber: order.orderNumber } },
      { idempotencyKey: `refund-${order._id}` },
    )
    order.paymentStatus = 'refunded'
    order.stripe.refundId = refund.id
  } catch (err) {
    console.error(`[payments] Refund failed for ${order.orderNumber}: ${err.message}`)
    order.paymentStatus = 'refund_failed'
  }
  await order.save()
}

// Called right after any order is cancelled (by the customer, the seller
// or the admin), so the money side follows:
//   paid     → refund this order's part
//   awaiting → it can't be paid any more; close the payment page so the
//              customer can't pay for it. The checkout's other unpaid parts
//              can still be paid with "Pay now".
export async function handleCancelledOrderPayment(order) {
  if (order.paymentMethod !== 'card') return
  if (order.paymentStatus === 'paid') return refundOrder(order)
  if (order.paymentStatus === 'awaiting') {
    await Order.updateOne({ _id: order._id }, { $set: { paymentStatus: 'unpaid' } })
    const sessionId = order.stripe?.checkoutSessionId
    if (sessionId) await expireSessionQuietly(sessionId)
  }
}

// Our server asks Stripe directly how a checkout's payment went — used when
// the customer comes back from the payment page, so the order shows "Paid"
// right away even if the webhook hasn't arrived (or, while developing on
// your own computer, can't arrive at all).
export async function refreshCheckoutPayment(orders) {
  const sessionId = orders.find((order) => order.paymentStatus === 'awaiting')?.stripe?.checkoutSessionId
  if (!sessionId) return
  const session = await getStripe().checkout.sessions.retrieve(sessionId)
  if (session.payment_status === 'paid') await markCheckoutPaid(session)
}
