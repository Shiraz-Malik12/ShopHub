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
router.post(
  '/reset-password',
  otpLimiter,
  resetPasswordRules,
  handleValidation,
  authController.resetPassword,
)

export default router
