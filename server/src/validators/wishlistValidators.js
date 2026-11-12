import { body, param } from 'express-validator'
import { handleValidation } from './handleValidation.js'
import { MAX_WISHLIST_ITEMS } from '../models/Wishlist.js'

export { handleValidation }

export const wishlistProductRules = [param('productId').isMongoId().withMessage('Invalid product id')]

// A guest's wishlist sent from the browser: { productIds: [...] }.
export const guestWishlistRules = [
  body('productIds')
    .isArray({ max: MAX_WISHLIST_ITEMS })
    .withMessage(`productIds must be a list of at most ${MAX_WISHLIST_ITEMS} ids`),
  body('productIds.*').isMongoId().withMessage('Invalid product id'),
]
