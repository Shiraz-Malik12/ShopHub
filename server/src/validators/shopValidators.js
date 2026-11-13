import { body, param, query } from 'express-validator'
import { handleValidation } from './handleValidation.js'
import { SHOP_STATUSES } from '../models/Shop.js'

export { handleValidation }

// The statuses the admin can choose on the Shops page. 'pending' isn't one:
// only a new or resubmitted application is pending.
export const ADMIN_SHOP_DECISIONS = ['approved', 'rejected', 'suspended']

// Shared by "apply" and "edit my application". On edit every field is
// optional — only the fields sent are checked and changed.
function shopFieldRules({ requireAll }) {
  const field = (chain) => (requireAll ? chain : chain.optional())
  return [
    field(body('name'))
      .isString()
      .trim()
      .isLength({ min: 2, max: 60 })
      .withMessage('Shop name must be between 2 and 60 characters')
      // The shop's web address (/shops/ali-electronics) is made from the
      // name using English letters and numbers only, so it needs at least one.
      .matches(/[a-zA-Z0-9]/)
      .withMessage('Shop name must include at least one English letter or number'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be 500 characters or less'),
    field(body('phone'))
      .isString()
      .trim()
      .matches(/^\+?[0-9][0-9\s-]{6,18}$/)
      .withMessage('Enter a valid phone number'),
    field(body('city'))
      .isString()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('City must be between 2 and 80 characters'),
  ]
}

export const applyShopRules = shopFieldRules({ requireAll: true })
export const updateMyShopRules = shopFieldRules({ requireAll: false })

// Admin Shops page filters (all optional): ?status=&search=&page=&limit=
export const listShopsRules = [
  query('status').optional().isIn(SHOP_STATUSES).withMessage('Unknown shop status'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search text is too long'),
  query('page').optional().isInt({ min: 1, max: 10000 }).withMessage('Page must be a whole number from 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be a whole number from 1 to 50').toInt(),
]

export const shopIdRules = [param('id').isMongoId().withMessage('Invalid shop id')]

// PATCH /api/admin/shops/:id/status  { status, reason }
// A reason is required for bad news (reject, suspend) so the owner always
// knows why; it's ignored when approving.
export const setShopStatusRules = [
  ...shopIdRules,
  body('status').isIn(ADMIN_SHOP_DECISIONS).withMessage('Status must be approved, rejected or suspended'),
  body('reason')
    .if(body('status').isIn(['rejected', 'suspended']))
    .isString()
    .trim()
    .isLength({ min: 5, max: 300 })
    .withMessage('Please give a reason between 5 and 300 characters'),
]
