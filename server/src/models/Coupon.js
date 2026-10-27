import mongoose from 'mongoose'

export const COUPON_TYPES = ['percent', 'fixed']
export const COUPON_CODE_PATTERN = /^[A-Z0-9-]{3,20}$/

// A discount code the admin creates, e.g. SAVE10 = 10% off.
const couponSchema = new mongoose.Schema(
  {
    // Always stored in CAPITALS, so "save10" and "SAVE10" are the same code.
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, match: COUPON_CODE_PATTERN },
    // percent: value 10 = 10% off.  fixed: value 5 = $5 off.
    type: { type: String, enum: COUPON_TYPES, required: true },
    value: { type: Number, required: true, min: 0.01 },
    // The cart must be at least this much before the coupon works.
    minSubtotal: { type: Number, default: 0, min: 0 },
    // null = no limit. usedCount goes up by 1 for every order that uses it
    // (and back down if that order is cancelled).
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    // null = never expires.
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('Coupon', couponSchema)
