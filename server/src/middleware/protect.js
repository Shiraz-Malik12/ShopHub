import User from '../models/User.js'
import { verifyAccessToken } from '../utils/tokens.js'

// Guards routes like GET /api/auth/me. The frontend's ProtectedRoute is a
// UX nicety only — this middleware is the actual authorization boundary.
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
    req.user = user
    next()
  } catch {
    // Covers both an expired token and a tampered/invalid one — same
    // response either way so we don't leak which case it was.
    return res.status(401).json({ message: 'Session expired, please log in again' })
  }
}
