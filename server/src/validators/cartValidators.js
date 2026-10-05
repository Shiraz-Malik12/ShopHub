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
