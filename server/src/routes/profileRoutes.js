import { Router } from 'express'
import * as profileController from '../controllers/profileController.js'
import { protect } from '../middleware/protect.js'
import { authLimiter } from '../middleware/rateLimiters.js'
import {
  updateProfileRules,
  changePasswordRules,
  savedAddressRules,
  handleValidation,
} from '../validators/profileValidators.js'

const router = Router()

// Everything here is about the signed-in user's own account.
router.use(protect)

router.patch('/', updateProfileRules, handleValidation, profileController.updateProfile)
// Rate-limited like login: otherwise a stolen, signed-in session could be
// used to guess the current password over and over.
router.patch('/password', authLimiter, changePasswordRules, handleValidation, profileController.changePassword)
router.put('/address', savedAddressRules, handleValidation, profileController.saveAddress)
router.delete('/address', profileController.removeAddress)

export default router
