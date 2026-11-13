import { body, param, query } from 'express-validator'
import { handleValidation } from './handleValidation.js'
import { ORDER_STATUSES, PAYMENT_METHODS } from '../models/Order.js'
import { addressRules } from './addressRules.js'

export { handleValidation }

export const placeOrderRules = [
  ...addressRules('shippingAddress.'),
  body('shippingAddress.notes')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be at most 500 characters'),
  // "Save this address for next time" checkbox at checkout.
  body('saveAddress').optional().isBoolean().withMessage('saveAddress must be true or false').toBoolean(),
  // Optional coupon code. Only the code is sent — the server works out the discount.
  body('couponCode').optional({ values: 'falsy' }).isString().trim().isLength({ max: 30 }).withMessage('Invalid coupon code'),
  // 'cod' (default) or 'card' (Stripe).
  body('paymentMethod').optional().isIn(PAYMENT_METHODS).withMessage('Payment method must be cod or card'),
]

// The checkout number in /api/payments/checkouts/:checkoutId/...
export const checkoutIdRules = [
  param('checkoutId')
    .matches(/^SH-\d{6}-[A-Z0-9]{5}$/)
    .withMessage('Invalid checkout number'),
]

export const orderIdRules = [param('id').isMongoId().withMessage('Invalid order id')]

export const updateOrderStatusRules = [
  param('id').isMongoId().withMessage('Invalid order id'),
  body('status').isIn(ORDER_STATUSES).withMessage('Invalid order status'),
]

export const listOrdersRules = [query('status').optional().isIn(ORDER_STATUSES).withMessage('Invalid order status')]
