import { body, param, query } from 'express-validator'
import { handleValidation } from './handleValidation.js'
import { ORDER_STATUSES } from '../models/Order.js'
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
]

export const orderIdRules = [param('id').isMongoId().withMessage('Invalid order id')]

export const updateOrderStatusRules = [
  param('id').isMongoId().withMessage('Invalid order id'),
  body('status').isIn(ORDER_STATUSES).withMessage('Invalid order status'),
]

export const listOrdersRules = [query('status').optional().isIn(ORDER_STATUSES).withMessage('Invalid order status')]
