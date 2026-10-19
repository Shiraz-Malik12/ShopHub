import User from '../models/User.js'
import { verifyAccessToken } from '../utils/tokens.js'

// `code` lets the frontend tell "blocked" apart from other 403 answers
// (like "email not verified" at login) without comparing message text.
export const ACCOUNT_BLOCKED_RESPONSE = {
  code: 'ACCOUNT_BLOCKED',
  message: 'Your account has been blocked. Please contact the shop if you think this is a mistake.',
}

// Guards routes like GET /api/auth/me. The frontend's ProtectedRoute is a
// UX nicety only — this middleware is the actual authorization boundary yesh.
export async function protect(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  const token = header.slice('Bearer '.length)

  try {
    const decoded = verifyAccessToken(token)
    const user = await User.findById(decoded.sub)
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' })
    }
    // Checked on EVERY request, not just at login: an access token stays
    // valid for 15 minutes, so a customer blocked while signed in would
    // otherwise keep shopping until it ran out.
    if (user.isBlocked) {
      return res.status(403).json(ACCOUNT_BLOCKED_RESPONSE)
    }
    req.user = user
    next()
  } catch {
    // Covers both an expired token and a tampered/invalid one — same
    // response either way so we don't leak which case it was.
    return res.status(401).json({ message: 'Session expired, please log in again' })
  }
}
