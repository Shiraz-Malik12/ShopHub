import { body, param } from 'express-validator'
import { handleValidation } from './handleValidation.js'
import { MAX_COMMENT_LENGTH } from '../models/Review.js'

export { handleValidation }

export const productParamRules = [param('productId').isMongoId().withMessage('Invalid product id')]

export const saveReviewRules = [
  ...productParamRules,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be a whole number from 1 to 5').toInt(),
  body('comment')
    .optional({ values: 'null' })
    .isString()
    .trim()
    .isLength({ max: MAX_COMMENT_LENGTH })
    .withMessage(`Comment must be at most ${MAX_COMMENT_LENGTH} characters`),
]

export const reviewIdRules = [...productParamRules, param('reviewId').isMongoId().withMessage('Invalid review id')]
