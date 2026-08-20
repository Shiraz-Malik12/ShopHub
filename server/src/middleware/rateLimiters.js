import rateLimit from 'express-rate-limit'

// Register/login: generous enough for real use and retries, tight enough
// to blunt credential-stuffing/spam-signup scripts.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
})

// Verify/resend: stricter, since these are exactly what an OTP-guessing
// or resend-spam script would hammer. Backs up the per-account attempts
// counter and cooldown already enforced in authController.
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
})
