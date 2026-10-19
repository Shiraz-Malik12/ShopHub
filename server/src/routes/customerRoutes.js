import { Router } from 'express'
import * as customerController from '../controllers/customerController.js'
import { protect } from '../middleware/protect.js'
import { requireAdmin } from '../middleware/authorize.js'
import {
  listCustomersRules,
  customerIdRules,
  blockCustomerRules,
  handleValidation,
} from '../validators/customerValidators.js'

const router = Router()

// Customer data is for the shop owner only.
router.use(protect, requireAdmin)

router.get('/', listCustomersRules, handleValidation, customerController.listCustomers)
router.get('/:id', customerIdRules, handleValidation, customerController.getCustomer)
router.patch('/:id/block', blockCustomerRules, handleValidation, customerController.setCustomerBlocked)

export default router
