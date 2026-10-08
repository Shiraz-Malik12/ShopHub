import { body, param, query } from 'express-validator'
import { handleValidation } from './handleValidation.js'
import { ORDER_STATUSES } from '../models/Order.js'

export { handleValidation }

export const placeOrderRules = [
  body('shippingAddress.fullName')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Full name must be between 2 and 80 characters'),
  body('shippingAddress.phone')
    .trim()
    .matches(/^\+?[0-9][0-9\s-]{6,18}$/)
    .withMessage('Enter a valid phone number'),
  body('shippingAddress.addressLine')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('shippingAddress.city').trim().isLength({ min: 2, max: 80 }).withMessage('City must be between 2 and 80 characters'),
  body('shippingAddress.postalCode')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 })
    .withMessage('Postal code must be at most 20 characters'),
  body('shippingAddress.notes')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be at most 500 characters'),
]

export const orderIdRules = [param('id').isMongoId().withMessage('Invalid order id')]

export const updateOrderStatusRules = [
  param('id').isMongoId().withMessage('Invalid order id'),
  body('status').isIn(ORDER_STATUSES).withMessage('Invalid order status'),
]

export const listOrdersRules = [query('status').optional().isIn(ORDER_STATUSES).withMessage('Invalid order status')]
