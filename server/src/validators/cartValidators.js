import { body, param } from 'express-validator'
import { handleValidation } from './handleValidation.js'
import { MAX_ITEM_QUANTITY } from '../models/Cart.js'

export { handleValidation }

const quantityMessage = `Quantity must be a whole number between 1 and ${MAX_ITEM_QUANTITY}`

export const addCartItemRules = [
  body('productId').isMongoId().withMessage('Invalid product id'),
  body('quantity').optional().isInt({ min: 1, max: MAX_ITEM_QUANTITY }).withMessage(quantityMessage).toInt(),
]

export const updateCartItemRules = [
  param('productId').isMongoId().withMessage('Invalid product id'),
  body('quantity').isInt({ min: 1, max: MAX_ITEM_QUANTITY }).withMessage(quantityMessage).toInt(),
]

export const cartItemIdRules = [param('productId').isMongoId().withMessage('Invalid product id')]

// A guest's cart sent from the browser: [{ productId, quantity }, ...].
// Capped at MAX_GUEST_LINES so nobody can post a giant list.
export const MAX_GUEST_LINES = 50

export const guestCartRules = [
  body('items').isArray({ max: MAX_GUEST_LINES }).withMessage(`items must be a list of at most ${MAX_GUEST_LINES} products`),
  body('items.*.productId').isMongoId().withMessage('Invalid product id'),
  body('items.*.quantity').isInt({ min: 1, max: MAX_ITEM_QUANTITY }).withMessage(quantityMessage).toInt(),
]
