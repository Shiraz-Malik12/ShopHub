import { param } from 'express-validator'
import { handleValidation } from './handleValidation.js'

export { handleValidation }

export const wishlistProductRules = [param('productId').isMongoId().withMessage('Invalid product id')]
