import mongoose from 'mongoose'

// Embedded, not a separate collection: an OTP only ever belongs to one
// user and has no lifecycle of its own, so there's nothing a join buys us.
const otpSchema = new mongoose.Schema(
  {
    codeHash: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
    purpose: { type: String, enum: ['verify-email', 'reset-password'] },
    lastSentAt: Date,
  },
  { _id: false },
)

// The customer's own delivery address, saved from the profile page or at
// checkout, so the checkout form can be filled in for them next time.
const savedAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    addressLine: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 20, default: '' },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select: false — never returned by a plain find()/findOne(); callers
    // that need it ask explicitly via .select('+passwordHash').
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    isVerified: { type: Boolean, default: false },
    otp: { type: otpSchema, default: undefined },
    refreshTokenHash: { type: String, select: false },
    savedAddress: { type: savedAddressSchema, default: undefined },
    // Set by the admin on the Customers page. A blocked customer can't log
    // in, and protect.js turns away any request they still make.
    isBlocked: { type: Boolean, default: false },
    blockedAt: { type: Date, default: undefined },
  },
  { timestamps: true },
)

export default mongoose.model('User', userSchema)
