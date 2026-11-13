import { Router } from 'express'
import * as paymentController from '../controllers/paymentController.js'
import { protect } from '../middleware/protect.js'
import { checkoutIdRules, handleValidation } from '../validators/orderValidators.js'

const router = Router()

// Public: does the checkout page offer card payment?
router.get('/config', paymentController.getPaymentConfig)

// The customer's own checkouts.
router.get('/checkouts/:checkoutId', protect, checkoutIdRules, handleValidation, paymentController.getCheckoutPayment)
router.post('/checkouts/:checkoutId/pay', protect, checkoutIdRules, handleValidation, paymentController.payCheckout)

// (The Stripe webhook is registered in app.js: it needs the raw body.)

export default router
