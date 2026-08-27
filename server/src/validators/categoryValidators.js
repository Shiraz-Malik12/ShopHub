import { body, param } from 'express-validator'
import { handleValidation } from './handleValidation.js'

export { handleValidation }

const MAX_NAME_LENGTH = 60

export const createCategoryRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: MAX_NAME_LENGTH })
    .withMessage(`Category name must be at most ${MAX_NAME_LENGTH} characters`),
]

export const updateCategoryRules = [
  param('id').isMongoId().withMessage('Invalid category id'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ max: MAX_NAME_LENGTH })
    .withMessage(`Category name must be at most ${MAX_NAME_LENGTH} characters`),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
]

export const deleteCategoryRules = [param('id').isMongoId().withMessage('Invalid category id')]
