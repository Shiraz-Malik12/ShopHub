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
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { algorithms: [ALGORITHM] })
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, { algorithms: [ALGORITHM] })
}
