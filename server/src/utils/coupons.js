import Coupon from '../models/Coupon.js'
import Order from '../models/Order.js'

// The coupon rules live here, in ONE place, because two places use them:
// "Apply" at checkout (a preview) and placing the order (the real thing).
// The browser never calculates a discount — it only shows what we send.

const priceFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function normalizeCouponCode(code) {
  return String(code || '').trim().toUpperCase()
}

// "10% off" / "$5.00 off"
export function describeCoupon(coupon) {
  return coupon.type === 'percent' ? `${coupon.value}% off` : `${priceFormatter.format(coupon.value)} off`
}

// How much money this coupon takes off this subtotal. Rounded to cents,
// and never more than the subtotal itself (a $10 coupon on a $6 cart = $6).
export function calculateDiscount(coupon, subtotal) {
  const raw = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value
  return Math.round(Math.min(raw, subtotal) * 100) / 100
}

// Finds the coupon and checks every rule. Returns { coupon, discount } when
// it can be used, or { error } with a message the customer can understand.
export async function checkCoupon(code, { subtotal, userId }) {
  const coupon = await Coupon.findOne({ code: normalizeCouponCode(code) })

  // Same message for "doesn't exist" and "switched off" — no need to tell
  // anyone which codes used to exist.
  if (!coupon || !coupon.isActive) return { error: 'This coupon code is not valid.' }
  if (coupon.expiresAt && coupon.expiresAt <= new Date()) return { error: 'This coupon has expired.' }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { error: 'This coupon has been fully used.' }
  }
  if (subtotal < coupon.minSubtotal) {
    return { error: `Spend at least ${priceFormatter.format(coupon.minSubtotal)} to use this coupon.` }
  }

  // One use per customer. A cancelled order gives the use back.
  const usedBefore = await Order.exists({ user: userId, 'coupon.code': coupon.code, status: { $ne: 'cancelled' } })
  if (usedBefore) return { error: 'You have already used this coupon.' }

  return { coupon, discount: calculateDiscount(coupon, subtotal) }
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

// Gives a use back (order cancelled, or placing it failed half-way).
export async function releaseCouponUse(code) {
  if (!code) return
  await Coupon.updateOne({ code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } })
}
