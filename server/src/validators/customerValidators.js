import { body, param, query } from 'express-validator'
import { handleValidation } from './handleValidation.js'

export { handleValidation }

// Admin customer list filters (all optional): ?search=&status=&page=&limit=
export const listCustomersRules = [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search text is too long'),
  query('status').optional().isIn(['active', 'blocked']).withMessage('Status must be active or blocked'),
  query('page').optional().isInt({ min: 1, max: 10000 }).withMessage('Page must be a whole number from 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be a whole number from 1 to 50').toInt(),
]

export const customerIdRules = [param('id').isMongoId().withMessage('Invalid customer id')]

export const blockCustomerRules = [
  ...customerIdRules,
  body('blocked').isBoolean({ strict: true }).withMessage('blocked must be true or false'),
]
