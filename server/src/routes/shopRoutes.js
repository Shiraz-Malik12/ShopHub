import { Router } from 'express'
import * as shopController from '../controllers/shopController.js'
import { protect } from '../middleware/protect.js'
import { authorize } from '../middleware/authorize.js'
import { applyShopRules, updateMyShopRules, handleValidation } from '../validators/shopValidators.js'

const router = Router()

// Applying for a shop needs a signed-in shopper. The admin is left out on
// purpose: the admin runs the marketplace, they don't apply to it.
router.use(protect, authorize('customer', 'seller'))

router.get('/mine', shopController.getMyShop)
router.patch('/mine', updateMyShopRules, handleValidation, shopController.updateMyShop)
router.post('/', applyShopRules, handleValidation, shopController.applyForShop)

export default router
