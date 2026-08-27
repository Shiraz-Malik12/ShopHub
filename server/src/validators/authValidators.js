import { body } from 'express-validator'
import { handleValidation } from './handleValidation.js'

// Re-exported so existing imports (authRoutes.js) keep working unchanged —
// the actual function now lives in handleValidation.js so other features
// (e.g. categoryValidators.js) can reuse it without importing from "auth".
export { handleValidation }

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
