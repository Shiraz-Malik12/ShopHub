import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { generateOtpCode, hashOtp, compareOtp } from '../utils/otp.js'
import { sendOtpEmail } from '../utils/sendEmail.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js'
import { sanitizeUser } from '../utils/sanitizeUser.js'

const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000 // 60 seconds — backend's own copy of the frontend's timer
const MAX_OTP_ATTEMPTS = 5

const REFRESH_COOKIE_NAME = 'refreshToken'
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function refreshCookieOptions() {
  return {
    httpOnly: true, // not readable from JS — mitigates XSS token theft
    secure: process.env.NODE_ENV === 'production', // HTTPS-only in prod
    sameSite: 'lax',
    path: '/api/auth', // only sent to auth endpoints, not every request
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  }
}

// Issues a fresh access+refresh pair, stores a hash of the refresh token
// (so we can detect reuse/invalidate on logout without storing it raw),
// and sets it as an httpOnly cookie. Shared by login, verify-otp, refresh.
async function issueSession(res, user) {
  const accessToken = signAccessToken(user._id.toString())
  const refreshToken = signRefreshToken(user._id.toString())
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10)
  await user.save()
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions())
  return accessToken
}

async function issueAndSendOtp(user, purpose = 'verify-email') {
  const code = generateOtpCode()
  user.otp = {
    codeHash: await hashOtp(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
    purpose,
    lastSentAt: new Date(),
  }
  await user.save()
  await sendOtpEmail(user.email, code, purpose)
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body
    let user = await User.findOne({ email })

    if (user?.isVerified) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    if (user && !user.isVerified) {
      // Same email registered before but never finished verifying — reuse
      // the row instead of leaving them stuck on a dead, un-signup-able
      // email forever. Latest name/password wins.
      user.name = name
      user.passwordHash = passwordHash
    } else {
      user = new User({ name, email, passwordHash })
    }

    await issueAndSendOtp(user)

    // No session issued here on purpose — the account isn't usable until
    // the OTP is verified.
    res.status(201).json({ message: 'OTP sent to your email', email: user.email })
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate-key race: two near-simultaneous registrations for the
      // same email both passed the findOne check before either saved.
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }
    next(err)
  }
}

export async function verifyOtpHandler(req, res, next) {
  try {
    const { email, code } = req.body
    const user = await User.findOne({ email })

    if (!user || !user.otp?.codeHash) {
      return res.status(400).json({ message: 'No pending verification for this email.' })
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified.' })
    }
    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Code expired. Please request a new one.' })
    }
    if (user.otp.attempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many attempts. Please request a new code.' })
    }

    const isMatch = await compareOtp(code, user.otp.codeHash)
    if (!isMatch) {
      user.otp.attempts += 1
      await user.save()
      return res.status(400).json({ message: 'Invalid code.' })
    }

    user.isVerified = true
    user.otp = undefined
    const accessToken = await issueSession(res, user)

    res.status(200).json({ user: sanitizeUser(user), accessToken })
  } catch (err) {
    next(err)
  }
}

export async function resendOtpHandler(req, res, next) {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ message: 'No account found for this email.' })
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified.' })
    }
    if (user.otp?.lastSentAt && Date.now() - user.otp.lastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      return res.status(429).json({ message: 'Please wait a bit before requesting another code.' })
    }

    await issueAndSendOtp(user)
    res.status(200).json({ message: 'A new code has been sent.' })
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+passwordHash')

    // Same generic message whether the email doesn't exist or the
    // password is wrong — never let a login form confirm which emails
    // are registered.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    if (!user.isVerified) {
      // 403, not 401: credentials were correct, the account just isn't
      // usable yet. LoginPage.jsx checks specifically for this status to
      // redirect into the OTP screen instead of showing a generic error.
      return res.status(403).json({ message: 'Please verify your email before logging in.' })
    }

    const accessToken = await issueSession(res, user)
    res.status(200).json({ user: sanitizeUser(user), accessToken })
  } catch (err) {
    next(err)
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME]
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const decoded = verifyRefreshToken(token)
    const user = await User.findById(decoded.sub).select('+refreshTokenHash')
    if (!user?.refreshTokenHash || !(await bcrypt.compare(token, user.refreshTokenHash))) {
      // Doesn't match the last token we issued — could be an old, already-
      // rotated token being replayed. Don't honor it.
      return res.status(401).json({ message: 'Session expired, please log in again.' })
    }

    const accessToken = await issueSession(res, user) // rotates the refresh token too
    res.status(200).json({ accessToken })
  } catch (err) {
    next(err)
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME]
    if (token) {
      try {
        const decoded = verifyRefreshToken(token)
        await User.findByIdAndUpdate(decoded.sub, { $unset: { refreshTokenHash: 1 } })
      } catch {
        // Token already expired/invalid — nothing server-side to clean up.
      }
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' })
    res.status(200).json({ message: 'Logged out' })
  } catch (err) {
    next(err)
  }
}

export async function me(req, res) {
  res.status(200).json({ user: sanitizeUser(req.user) })
}

// Deliberately always returns the same generic message, whether or not
// the email is registered — this endpoint is the classic account-
// enumeration target, so we never let its response confirm an email
// exists. It only actually sends when a *verified* user is found; an
// unverified account should finish registering instead of "resetting"
// a password it never fully set up.
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })

    if (user?.isVerified) {
      const withinCooldown =
        user.otp?.lastSentAt && Date.now() - user.otp.lastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS
      // Silently skip re-sending inside the cooldown instead of returning
      // 429 — a distinguishable status code here would itself leak that
      // the account exists.
      if (!withinCooldown) {
        await issueAndSendOtp(user, 'reset-password')
      }
    }

    res.status(200).json({ message: 'If an account exists for that email, a reset code has been sent.' })
  } catch (err) {
    next(err)
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword } = req.body
    const user = await User.findOne({ email })

    if (!user || user.otp?.purpose !== 'reset-password' || !user.otp?.codeHash) {
      return res.status(400).json({ message: 'Invalid or expired code.' })
    }
    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired code.' })
    }
    if (user.otp.attempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many attempts. Please request a new code.' })
    }

    const isMatch = await compareOtp(code, user.otp.codeHash)
    if (!isMatch) {
      user.otp.attempts += 1
      await user.save()
      return res.status(400).json({ message: 'Invalid or expired code.' })
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10)
    user.otp = undefined
    // Changing the password invalidates every existing session — anyone
    // (including whoever the password was reset against) needs to log in
    // fresh with the new one.
    user.refreshTokenHash = undefined
    await user.save()

    res.status(200).json({ message: 'Password reset successful. Please log in.' })
  } catch (err) {
    next(err)
  }
}
