import { Router } from 'express'
import * as couponController from '../controllers/couponController.js'
import { protect } from '../middleware/protect.js'
import { requireAdmin } from '../middleware/authorize.js'
import { adminScope } from '../middleware/shopScope.js'
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

// Admin only: manage every code; new ones are site-wide. (Sellers manage
// their own shop's codes under /api/seller/coupons.)
router.get('/', requireAdmin, adminScope, couponController.listCoupons)
router.post('/', requireAdmin, adminScope, createCouponRules, handleValidation, couponController.createCoupon)
router.patch('/:id', requireAdmin, adminScope, updateCouponRules, handleValidation, couponController.updateCoupon)
router.delete('/:id', requireAdmin, adminScope, couponIdRules, handleValidation, couponController.deleteCoupon)

export default router
