import { body } from 'express-validator'
import { handleValidation } from './handleValidation.js'
import { addressRules } from './addressRules.js'

export { handleValidation }

export const updateProfileRules = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters'),
]

export const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Enter your current password'),
  // Same minimum as sign-up and password reset (authValidators.js).
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('newPassword')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('New password must be different from your current password'),
]

export const savedAddressRules = addressRules()
