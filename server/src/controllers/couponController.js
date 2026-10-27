import Coupon from '../models/Coupon.js'
import Cart from '../models/Cart.js'
import { buildCartResponse } from './cartController.js'
import { checkCoupon, describeCoupon } from '../utils/coupons.js'

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

// The fields the admin may set. Anything else in the request (usedCount,
// _id...) is simply ignored.
const EDITABLE_FIELDS = ['type', 'value', 'minSubtotal', 'usageLimit', 'expiresAt', 'isActive']

function pickEditable(body) {
  const data = {}
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field]
  }
  return data
}

// A percent coupon above 100% would make orders cost less than nothing.
function checkPercent(type, value) {
  if (type === 'percent' && value > 100) throw fail(400, 'A percent discount can be at most 100.')
}

// ---------- Customer ----------

// POST /api/coupons/apply  { code }
// The "Apply" button at checkout. Only a PREVIEW: nothing is saved and no
// use is taken. Placing the order checks the coupon again for real.
export async function applyCoupon(req, res, next) {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
    const { subtotal } = cart ? await buildCartResponse(cart) : { subtotal: 0 }
    if (subtotal === 0) throw fail(400, 'Your cart is empty.')

    const { coupon, discount, error } = await checkCoupon(req.body.code, { subtotal, userId: req.user._id })
    if (error) throw fail(400, error)

    res.status(200).json({
      coupon: { code: coupon.code, description: describeCoupon(coupon) },
      subtotal,
      discount,
      total: Math.round((subtotal - discount) * 100) / 100,
    })
  } catch (err) {
    next(err)
  }
}

// ---------- Admin ----------

// GET /api/coupons — every coupon, newest first.
export async function listCoupons(req, res, next) {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1, _id: -1 })
    res.status(200).json({ coupons })
  } catch (err) {
    next(err)
  }
}

// POST /api/coupons  { code, type, value, minSubtotal?, usageLimit?, expiresAt?, isActive? }
export async function createCoupon(req, res, next) {
  try {
    checkPercent(req.body.type, req.body.value)
    const coupon = await Coupon.create({ code: req.body.code, ...pickEditable(req.body) })
    res.status(201).json({ message: 'Coupon created', coupon })
  } catch (err) {
    if (err.code === 11000) return next(fail(409, 'A coupon with this code already exists.'))
    next(err)
  }
}

// PATCH /api/coupons/:id — change any field except the code itself
// (customers may already know the code, and old orders show it).
export async function updateCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.id)
    if (!coupon) throw fail(404, 'Coupon not found.')

    coupon.set(pickEditable(req.body))
    checkPercent(coupon.type, coupon.value)
    await coupon.save()
    res.status(200).json({ message: 'Coupon updated', coupon })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/coupons/:id — orders that used it keep their own copy of the
// code and discount, so deleting never changes an old order.
export async function deleteCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id)
    if (!coupon) throw fail(404, 'Coupon not found.')
    res.status(200).json({ message: 'Coupon deleted' })
  } catch (err) {
    next(err)
  }
}
