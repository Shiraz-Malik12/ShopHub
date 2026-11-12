import { Router } from 'express'
import * as cartController from '../controllers/cartController.js'
import { protect } from '../middleware/protect.js'
import { cartPreviewLimiter } from '../middleware/rateLimiters.js'
import {
  addCartItemRules,
  updateCartItemRules,
  cartItemIdRules,
  guestCartRules,
  handleValidation,
} from '../validators/cartValidators.js'

const router = Router()

// Public: prices a guest's browser cart (nothing is saved). Registered
// BEFORE router.use(protect), so it doesn't need a signed-in user.
router.post('/preview', cartPreviewLimiter, guestCartRules, handleValidation, cartController.previewCart)

// Every route below needs a signed-in user: the cart belongs to req.user,
// which is why no route ever takes a user id from the request itself.
router.use(protect)

router.get('/', cartController.getCart)
router.delete('/', cartController.clearCart)
router.post('/items', addCartItemRules, handleValidation, cartController.addCartItem)
router.post('/merge', guestCartRules, handleValidation, cartController.mergeCart)
router.patch('/items/:productId', updateCartItemRules, handleValidation, cartController.updateCartItem)
router.delete('/items/:productId', cartItemIdRules, handleValidation, cartController.removeCartItem)

export default router
