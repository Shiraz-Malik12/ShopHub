import { body } from 'express-validator'

// The checks for a delivery address, written once and shared by checkout
// (fields under "shippingAddress.") and the profile's saved address (fields
// at the top level of the body). `prefix` is where the fields live.
export function addressRules(prefix = '') {
  return [
    body(`${prefix}fullName`)
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Full name must be between 2 and 80 characters'),
    body(`${prefix}phone`)
      .trim()
      .matches(/^\+?[0-9][0-9\s-]{6,18}$/)
      .withMessage('Enter a valid phone number'),
    body(`${prefix}addressLine`)
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be between 5 and 200 characters'),
    body(`${prefix}city`).trim().isLength({ min: 2, max: 80 }).withMessage('City must be between 2 and 80 characters'),
    body(`${prefix}postalCode`)
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 20 })
      .withMessage('Postal code must be at most 20 characters'),
  ]
}
