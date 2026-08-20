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
  },
  { timestamps: true },
)

export default mongoose.model('User', userSchema)
