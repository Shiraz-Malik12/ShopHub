import { body, validationResult } from 'express-validator'

// Every route below runs its *Rules array, then this, before the
// controller ever sees the request — the controller can assume valid
// shape and never has to re-check "is this actually an email?" itself.
export function handleValidation(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() })
  }
  next()
}

export const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
]

export const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]

export const otpRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('code').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Enter the 6-digit code'),
]

export const resendOtpRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
]

export const forgotPasswordRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
]

export const resetPasswordRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('code').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('Enter the 6-digit code'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
]
