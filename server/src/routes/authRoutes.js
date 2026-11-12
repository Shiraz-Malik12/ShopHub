import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import { protect } from '../middleware/protect.js'
import { authLimiter, otpLimiter, loginAccountLimiter } from '../middleware/rateLimiters.js'
import {
  registerRules,
  loginRules,
  otpRules,
  resendOtpRules,
  forgotPasswordRules,
  verifyResetCodeRules,
  resetPasswordRules,
  handleValidation,
} from '../validators/authValidators.js'

const router = Router()

router.post('/register', authLimiter, registerRules, handleValidation, authController.register)
router.post('/verify-otp', otpLimiter, otpRules, handleValidation, authController.verifyOtpHandler)
router.post('/resend-otp', otpLimiter, resendOtpRules, handleValidation, authController.resendOtpHandler)
router.post('/login', authLimiter, loginAccountLimiter, loginRules, handleValidation, authController.login)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)
router.get('/me', protect, authController.me)
router.post(
  '/forgot-password',
  otpLimiter,
  forgotPasswordRules,
  handleValidation,
  authController.forgotPassword,
)
// Forgot password, step 1: check the emailed code → one-time reset token.
router.post(
  '/verify-reset-code',
  otpLimiter,
  verifyResetCodeRules,
  handleValidation,
  authController.verifyResetCode,
)
// Step 2: set the new password with that token.
router.post(
  '/reset-password',
  otpLimiter,
  resetPasswordRules,
  handleValidation,
  authController.resetPassword,
)

export default router
