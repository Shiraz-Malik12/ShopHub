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

// authLimiter above is keyed by IP, which credential stuffing spread across
// many IPs/proxies simply routes around. This one is keyed by the account
// being targeted instead, and only counts *failed* attempts
// (skipSuccessfulRequests) so a legitimate user isn't penalized for their
// own successful logins sharing the window with earlier typos.
//
// In-memory store, same as authLimiter/otpLimiter — fine for a single
// server instance. Running multiple instances behind a load balancer would
// need a shared store (e.g. rate-limit-redis) for this to hold across them.
export const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.body?.email?.trim().toLowerCase() || req.ip,
  message: { message: 'Too many login attempts for this account. Please try again later.' },
})
