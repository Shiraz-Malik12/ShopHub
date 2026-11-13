import { Router } from 'express'
import * as shopController from '../controllers/shopController.js'
import { protect } from '../middleware/protect.js'
import { requireAdmin } from '../middleware/authorize.js'
import { listShopsRules, setShopStatusRules, handleValidation } from '../validators/shopValidators.js'

const router = Router()

// Reviewing shops is the marketplace owner's job only.
router.use(protect, requireAdmin)

router.get('/', listShopsRules, handleValidation, shopController.listShops)
router.patch('/:id/status', setShopStatusRules, handleValidation, shopController.setShopStatus)

export default router
