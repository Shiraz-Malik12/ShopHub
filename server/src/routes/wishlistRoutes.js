import { Router } from 'express'
import * as wishlistController from '../controllers/wishlistController.js'
import { protect } from '../middleware/protect.js'
import { wishlistProductRules, handleValidation } from '../validators/wishlistValidators.js'

const router = Router()

// Like the cart: the wishlist always belongs to req.user, so no route ever
// takes a user id from the request.
router.use(protect)

router.get('/', wishlistController.getWishlist)
router.post('/:productId', wishlistProductRules, handleValidation, wishlistController.addToWishlist)
router.delete('/:productId', wishlistProductRules, handleValidation, wishlistController.removeFromWishlist)

export default router
