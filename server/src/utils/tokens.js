import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

// Pinned explicitly on both sign and verify rather than left to jsonwebtoken's
// default — stops an algorithm-confusion attack (e.g. a token crafted with
// `alg: none` or swapped to an asymmetric alg) from ever being accepted.
const ALGORITHM = 'HS256'

export function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, process.env.ACCESS_TOKEN_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  })
}

export function signRefreshToken(userId) {
  return jwt.sign({ sub: userId }, process.env.REFRESH_TOKEN_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    // A random id makes every refresh token unique — even two issued for
    // the same user in the same second — so rotation always retires the old one.
    jwtid: crypto.randomUUID(),
  })
}

// Refresh tokens are stored as a SHA-256 hash, not bcrypt: bcrypt only reads
// the first 72 bytes of its input, and every refresh token for the same user
// starts with the same 72+ bytes (header + user id), so bcrypt would accept
// ANY old token of that user. SHA-256 covers the whole token; it's the
// standard choice for long random tokens (bcrypt stays for passwords).
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Compares in constant time, so response timing can't leak how much matched.
export function tokenMatchesHash(token, storedHash) {
  const actual = Buffer.from(hashToken(token))
  const expected = Buffer.from(storedHash)
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { algorithms: [ALGORITHM] })
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, { algorithms: [ALGORITHM] })
}
