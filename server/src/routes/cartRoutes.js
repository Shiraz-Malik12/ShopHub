import { Router } from 'express'
import * as cartController from '../controllers/cartController.js'
import { protect } from '../middleware/protect.js'
import {
  addCartItemRules,
  updateCartItemRules,
  cartItemIdRules,
  handleValidation,
} from '../validators/cartValidators.js'

const router = Router()

// Every cart route needs a signed-in user: the cart belongs to req.user,
// which is why no route ever takes a user id from the request itself.
router.use(protect)

router.get('/', cartController.getCart)
router.delete('/', cartController.clearCart)
router.post('/items', addCartItemRules, handleValidation, cartController.addCartItem)
router.patch('/items/:productId', updateCartItemRules, handleValidation, cartController.updateCartItem)
router.delete('/items/:productId', cartItemIdRules, handleValidation, cartController.removeCartItem)

export default router
