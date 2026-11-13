import Order from '../models/Order.js'
import { getStripe, isStripeConfigured } from '../utils/stripe.js'
import { createCheckoutSession, expireCheckout, markCheckoutPaid, refreshCheckoutPayment } from '../utils/payments.js'

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

// The signed-in customer's orders of one checkout (someone else's checkout
// is simply "not found").
async function myCheckoutOrders(req) {
  const orders = await Order.find({ checkoutId: req.params.checkoutId, user: req.user._id }).sort({ orderNumber: 1 })
  if (orders.length === 0) throw fail(404, 'Order not found.')
  return orders
}

function paymentSummary(orders) {
  return orders.map((order) => ({ _id: order._id, orderNumber: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus }))
}

// GET /api/payments/config — public. Tells the checkout page whether to
// offer card payment, and whether it's Stripe's test mode (so the page can
// show the test card number).
export function getPaymentConfig(req, res) {
  const key = process.env.STRIPE_SECRET_KEY || ''
  res.status(200).json({ cardEnabled: isStripeConfigured(), testMode: !key.startsWith('sk_live_') })
}

// GET /api/payments/checkouts/:checkoutId — the customer came back from
// Stripe's page. We ask STRIPE how it went (never trusting "?payment=success"
// in the address), update the orders, and answer with their payment status.
export async function getCheckoutPayment(req, res, next) {
  try {
    let orders = await myCheckoutOrders(req)
    if (orders.some((order) => order.paymentStatus === 'awaiting')) {
      await refreshCheckoutPayment(orders)
      orders = await myCheckoutOrders(req)
    }
    res.status(200).json({ payments: paymentSummary(orders) })
  } catch (err) {
    next(err)
  }
}

// POST /api/payments/checkouts/:checkoutId/pay — "Pay now": opens a fresh
// Stripe payment page for the orders of this checkout that still need paying
// (e.g. the customer closed the page, or one shop's part was cancelled).
export async function payCheckout(req, res, next) {
  try {
    const orders = await myCheckoutOrders(req)
    const unpaid = orders.filter((order) => order.paymentStatus === 'awaiting' && order.status === 'pending')
    if (unpaid.length === 0) throw fail(400, 'There is nothing left to pay for this order.')

    const paymentUrl = await createCheckoutSession(unpaid, req.user)
    // null = it turned out to be paid already (on the old page).
    if (!paymentUrl) {
      return res.status(200).json({ message: 'This order is already paid.', payments: paymentSummary(await myCheckoutOrders(req)) })
    }
    res.status(200).json({ paymentUrl })
  } catch (err) {
    next(err)
  }
}

// POST /api/payments/webhook — called by STRIPE's servers, not a browser.
// The signature check proves the message really comes from Stripe (anyone
// could send a fake "it's paid!" to this address otherwise). That check
// needs the raw, unparsed body — see app.js.
export async function handleStripeWebhook(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return res.status(503).json({ message: 'Webhook not configured' })

  let event
  try {
    event = getStripe().webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret)
  } catch (err) {
    return res.status(400).json({ message: `Webhook signature check failed: ${err.message}` })
  }

  try {
    const session = event.data.object
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        // "completed" can also mean "submitted, money still on its way"
        // (some bank methods) — only "paid" counts.
        if (session.payment_status === 'paid') await markCheckoutPaid(session)
        break
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed':
        await expireCheckout(session)
        break
      default:
        break // other events aren't needed by the shop
    }
    // 200 tells Stripe "got it". Anything else and Stripe sends it again
    // later — which is safe, because every handler above can run twice.
    res.status(200).json({ received: true })
  } catch (err) {
    console.error(`[payments] Webhook ${event.type} failed:`, err.message)
    res.status(500).json({ message: 'Webhook handling failed' })
  }
}
