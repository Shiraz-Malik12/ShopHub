import { Router } from 'express'
import * as shopController from '../controllers/shopController.js'
import { protect } from '../middleware/protect.js'
import { authorize } from '../middleware/authorize.js'
import { applyShopRules, updateMyShopRules, shopSlugRules, handleValidation } from '../validators/shopValidators.js'

const router = Router()

// Applying for a shop needs a signed-in shopper. The admin is left out on
// purpose: the admin runs the marketplace, they don't apply to it.
const shopper = [protect, authorize('customer', 'seller')]

// "/mine" comes before "/:slug" so Express doesn't read "mine" as a shop
// address (it's also a reserved slug — see RESERVED_SHOP_SLUGS).
router.get('/mine', shopper, shopController.getMyShop)
router.patch('/mine', shopper, updateMyShopRules, handleValidation, shopController.updateMyShop)
router.post('/', shopper, applyShopRules, handleValidation, shopController.applyForShop)

// Public: anyone can open a shop's page.
router.get('/:slug', shopSlugRules, handleValidation, shopController.getPublicShop)

export default router
