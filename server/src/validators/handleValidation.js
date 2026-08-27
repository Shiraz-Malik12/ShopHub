import { validationResult } from 'express-validator'

// Every route runs its *Rules array, then this, before the controller ever
// sees the request — the controller can assume valid shape and never has to
// re-check "is this actually an email?" itself. Shared by every feature's
// validators (auth, categories, ...).
export function handleValidation(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() })
  }
  next()
}
