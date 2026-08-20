import crypto from 'crypto'
import bcrypt from 'bcryptjs'

// crypto.randomInt is cryptographically strong, unlike Math.random() —
// worth it for something whose entire job is proving identity.
export function generateOtpCode() {
  return crypto.randomInt(100000, 1000000).toString() // always 6 digits
}

// Hashed with the same bcrypt cost as passwords: if the DB ever leaks, a
// plaintext OTP column would be a bigger prize than the user realizes
// (it's a live "become this account" code for the next 10 minutes).
export function hashOtp(code) {
  return bcrypt.hash(code, 10)
}

export function compareOtp(code, hash) {
  if (!hash) return Promise.resolve(false)
  return bcrypt.compare(code, hash)
}
