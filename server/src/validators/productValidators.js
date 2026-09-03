import { body, param } from 'express-validator'
import { handleValidation } from './handleValidation.js'

export { handleValidation }

const MAX_NAME_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 2000

const productFields = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: MAX_NAME_LENGTH })
    .withMessage(`Product name must be at most ${MAX_NAME_LENGTH} characters`),
  body('description')
    .optional()
    .trim()
    .isLength({ max: MAX_DESCRIPTION_LENGTH })
    .withMessage(`Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number')
    .toFloat(),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer')
    .toInt(),
  body('category').isMongoId().withMessage('Valid category id is required'),
]

export const createProductRules = productFields

export const updateProductRules = [
  param('id').isMongoId().withMessage('Invalid product id'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty')
    .isLength({ max: MAX_NAME_LENGTH })
    .withMessage(`Product name must be at most ${MAX_NAME_LENGTH} characters`),
  body('description')
    .optional()
    .trim()
    .isLength({ max: MAX_DESCRIPTION_LENGTH })
    .withMessage(`Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number').toFloat(),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer').toInt(),
  body('category').optional().isMongoId().withMessage('Invalid category id'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
]

export const productIdRules = [param('id').isMongoId().withMessage('Invalid product id')]
