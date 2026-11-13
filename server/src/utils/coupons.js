import Coupon from '../models/Coupon.js'
import Order from '../models/Order.js'
import Shop from '../models/Shop.js'

// The coupon rules live here, in ONE place, because two places use them:
// "Apply" at checkout (a preview) and placing the order (the real thing).
// The browser never calculates a discount — it only shows what we send.

const priceFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function normalizeCouponCode(code) {
  return String(code || '').trim().toUpperCase()
}

// "10% off" / "$5.00 off" — or, for a shop's coupon, "10% off Ali Gadgets products"
export function describeCoupon(coupon, shopName = null) {
  const amount = coupon.type === 'percent' ? `${coupon.value}% off` : `${priceFormatter.format(coupon.value)} off`
  return shopName ? `${amount} ${shopName} products` : amount
}

// Cart lines → { shopId: subtotal }. A shop's coupon is checked against its
// own part of the cart only. `items`: [{ shopId, lineTotal }]
export function subtotalsByShop(items) {
  const totals = new Map()
  for (const { shopId, lineTotal } of items) {
    totals.set(String(shopId), (totals.get(String(shopId)) || 0) + lineTotal)
  }
  return totals
}

// How much money this coupon takes off this subtotal. Rounded to cents,
// and never more than the subtotal itself (a $10 coupon on a $6 cart = $6).
export function calculateDiscount(coupon, subtotal) {
  const raw = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value
  return Math.round(Math.min(raw, subtotal) * 100) / 100
}

// Finds the coupon and checks every rule. `shopTotals` is the cart split by
// shop (see subtotalsByShop). Returns, when it can be used:
//   { coupon, discount, shopId, shopName }
// shopId/shopName are set for a shop's coupon: the discount then belongs to
// that shop's part of the order only. Otherwise { error } with a message
// the customer can understand.
export async function checkCoupon(code, { shopTotals, userId }) {
  const coupon = await Coupon.findOne({ code: normalizeCouponCode(code) })

  // Same message for "doesn't exist" and "switched off" — no need to tell
  // anyone which codes used to exist.
  if (!coupon || !coupon.isActive) return { error: 'This coupon code is not valid.' }

  // Which part of the cart the coupon works on: everything for the admin's
  // coupons, only that shop's items for a seller's coupon.
  let subtotal = [...shopTotals.values()].reduce((sum, value) => sum + value, 0)
  let shopId = null
  let shopName = null
  if (coupon.shop) {
    const shop = await Shop.findById(coupon.shop).select('name status')
    // A suspended shop's coupons stop working with the shop.
    if (!shop || shop.status !== 'approved') return { error: 'This coupon code is not valid.' }
    shopId = String(shop._id)
    shopName = shop.name
    subtotal = shopTotals.get(shopId) || 0
    if (subtotal === 0) return { error: `This coupon only works on products from ${shop.name}.` }
  }
  if (coupon.expiresAt && coupon.expiresAt <= new Date()) return { error: 'This coupon has expired.' }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { error: 'This coupon has been fully used.' }
  }
  if (subtotal < coupon.minSubtotal) {
    return {
      error: shopName
        ? `Spend at least ${priceFormatter.format(coupon.minSubtotal)} on ${shopName} products to use this coupon.`
        : `Spend at least ${priceFormatter.format(coupon.minSubtotal)} to use this coupon.`,
    }
  }

  // One use per customer. A cancelled order gives the use back.
  const usedBefore = await Order.exists({ user: userId, 'coupon.code': coupon.code, status: { $ne: 'cancelled' } })
  if (usedBefore) return { error: 'You have already used this coupon.' }

  return { coupon, discount: calculateDiscount(coupon, subtotal), shopId, shopName }
}

// Takes one use of the coupon — in ONE step, only if a use is still left
// (the same "check and take together" trick as the product stock). Returns
// false if someone else just took the last use.
export async function claimCouponUse(coupon) {
  const filter = { _id: coupon._id, isActive: true }
  if (coupon.usageLimit !== null) filter.usedCount = { $lt: coupon.usageLimit }
  const result = await Coupon.updateOne(filter, { $inc: { usedCount: 1 } })
  return result.modifiedCount === 1
}

// Gives a use back (placing the order failed half-way).
export async function releaseCouponUse(code) {
  if (!code) return
  await Coupon.updateOne({ code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } })
}

// Called after an order is cancelled. One checkout = one coupon use, even
// when it was split into one order per shop. So the use comes back only
// when EVERY order that got the coupon is cancelled:
//   • site-wide coupon → on every part, so all parts must be cancelled
//     (cancelling Ali's part while Sara's is still coming keeps it used)
//   • a shop's coupon  → only on that shop's part, so cancelling that part
//     is enough
export async function releaseCouponForCheckout(order) {
  const code = order.coupon?.code
  if (!code) return
  const withCoupon = { checkoutId: order.checkoutId, 'coupon.code': code }

  const stillActive = await Order.exists({ ...withCoupon, status: { $ne: 'cancelled' } })
  if (stillActive) return

  // Two parts cancelled at the same moment would both get here. The flag on
  // the FIRST order that got the coupon is flipped in one step, so only one
  // of them wins and gives the use back.
  const first = await Order.findOne(withCoupon).sort({ orderNumber: 1 }).select('_id')
  const claimed = await Order.updateOne({ _id: first._id, couponReleased: { $ne: true } }, { $set: { couponReleased: true } })
  if (claimed.modifiedCount === 1) await releaseCouponUse(code)
}
