import { Router } from 'express'
import * as couponController from '../controllers/couponController.js'
import { protect } from '../middleware/protect.js'
import { requireAdmin } from '../middleware/authorize.js'
import { couponLimiter } from '../middleware/rateLimiters.js'
import {
  applyCouponRules,
  createCouponRules,
  updateCouponRules,
  couponIdRules,
  handleValidation,
} from '../validators/couponValidators.js'

const router = Router()

router.use(protect)

// Any signed-in customer: check a code at checkout.
router.post('/apply', couponLimiter, applyCouponRules, handleValidation, couponController.applyCoupon)

// Admin only: manage the codes.
router.get('/', requireAdmin, couponController.listCoupons)
router.post('/', requireAdmin, createCouponRules, handleValidation, couponController.createCoupon)
router.patch('/:id', requireAdmin, updateCouponRules, handleValidation, couponController.updateCoupon)
router.delete('/:id', requireAdmin, couponIdRules, handleValidation, couponController.deleteCoupon)

export default router
