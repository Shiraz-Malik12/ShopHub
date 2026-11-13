import Coupon from '../models/Coupon.js'
import Cart from '../models/Cart.js'
import { buildCartResponse } from './cartController.js'
import { checkCoupon, describeCoupon, subtotalsByShop } from '../utils/coupons.js'
import { shopScopeOf } from '../middleware/shopScope.js'

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
    const { subtotal, items } = cart ? await buildCartResponse(cart) : { subtotal: 0, items: [] }
    if (subtotal === 0) throw fail(400, 'Your cart is empty.')

    // Only items that can be bought count (the same ones in `subtotal`).
    const shopTotals = subtotalsByShop(
      items.filter((item) => item.available).map((item) => ({ shopId: item.product.shop?._id, lineTotal: item.lineTotal })),
    )
    const { coupon, discount, shopName, error } = await checkCoupon(req.body.code, { shopTotals, userId: req.user._id })
    if (error) throw fail(400, error)

    res.status(200).json({
      coupon: { code: coupon.code, description: describeCoupon(coupon, shopName) },
      subtotal,
      discount,
      total: Math.round((subtotal - discount) * 100) / 100,
    })
  } catch (err) {
    next(err)
  }
}

// ---------- Admin and sellers ----------
// Same functions for both panels. shopScopeOf(req) limits a seller to their
// own shop's coupons; the admin sees (and can switch off) every coupon.

// GET /api/coupons (admin) · GET /api/seller/coupons (seller) — newest first.
export async function listCoupons(req, res, next) {
  try {
    const coupons = await Coupon.find(shopScopeOf(req)).populate('shop', 'name').sort({ createdAt: -1, _id: -1 })
    res.status(200).json({ coupons })
  } catch (err) {
    next(err)
  }
}

// POST { code, type, value, minSubtotal?, usageLimit?, expiresAt?, isActive? }
// A seller's coupon belongs to their shop; the admin's is site-wide (shop:
// null). Never taken from the request — a seller can't make a coupon for
// someone else's shop or for the whole site.
export async function createCoupon(req, res, next) {
  try {
    checkPercent(req.body.type, req.body.value)
    const coupon = await Coupon.create({
      code: req.body.code,
      ...pickEditable(req.body),
      shop: shopScopeOf(req).shop || null,
    })
    await coupon.populate('shop', 'name')
    res.status(201).json({ message: 'Coupon created', coupon })
  } catch (err) {
    // Codes are unique across the whole site, so it may be another shop's.
    if (err.code === 11000) return next(fail(409, 'This code is already taken. Please choose another.'))
    next(err)
  }
}

// PATCH /:id — change any field except the code itself (customers may
// already know the code, and old orders show it) and its shop.
export async function updateCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, ...shopScopeOf(req) })
    if (!coupon) throw fail(404, 'Coupon not found.')

    coupon.set(pickEditable(req.body))
    checkPercent(coupon.type, coupon.value)
    await coupon.save()
    await coupon.populate('shop', 'name')
    res.status(200).json({ message: 'Coupon updated', coupon })
  } catch (err) {
    next(err)
  }
}

// DELETE /:id — orders that used it keep their own copy of the code and
// discount, so deleting never changes an old order.
export async function deleteCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, ...shopScopeOf(req) })
    if (!coupon) throw fail(404, 'Coupon not found.')
    res.status(200).json({ message: 'Coupon deleted' })
  } catch (err) {
    next(err)
  }
}
