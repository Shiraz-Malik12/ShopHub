import { body, param } from 'express-validator'
import { handleValidation } from './handleValidation.js'
import { COUPON_CODE_PATTERN, COUPON_TYPES } from '../models/Coupon.js'

export { handleValidation }

// Customer "Apply" button.
export const applyCouponRules = [
  body('code').isString().trim().notEmpty().withMessage('Please enter a coupon code').isLength({ max: 30 }).withMessage('Invalid coupon code'),
]

// Shared by create and edit. `optional` on edit = only the fields sent are checked.
function couponFieldRules({ requireCore }) {
  const core = (chain) => (requireCore ? chain : chain.optional())
  return [
    core(body('type')).isIn(COUPON_TYPES).withMessage('Type must be percent or fixed'),
    core(body('value')).isFloat({ min: 0.01, max: 1000000 }).withMessage('Value must be more than 0').toFloat(),
    body('minSubtotal').optional().isFloat({ min: 0, max: 1000000 }).withMessage('Minimum order must be 0 or more').toFloat(),
    // null = no limit / never expires
    body('usageLimit').optional({ values: 'null' }).isInt({ min: 1, max: 1000000 }).withMessage('Usage limit must be a whole number from 1').toInt(),
    body('expiresAt').optional({ values: 'null' }).isISO8601().withMessage('Invalid expiry date').toDate(),
    body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be true or false'),
  ]
}

export const createCouponRules = [
  body('code')
    .isString()
    .trim()
    .toUpperCase()
    .matches(COUPON_CODE_PATTERN)
    .withMessage('Code must be 3–20 letters, numbers or dashes (e.g. SAVE10)'),
  ...couponFieldRules({ requireCore: true }),
]

export const couponIdRules = [param('id').isMongoId().withMessage('Invalid coupon id')]

export const updateCouponRules = [...couponIdRules, ...couponFieldRules({ requireCore: false })]
