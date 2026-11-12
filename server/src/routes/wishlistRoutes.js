import { Router } from 'express'
import * as wishlistController from '../controllers/wishlistController.js'
import { protect } from '../middleware/protect.js'
import { cartPreviewLimiter } from '../middleware/rateLimiters.js'
import { wishlistProductRules, guestWishlistRules, handleValidation } from '../validators/wishlistValidators.js'

const router = Router()

// Public: the products for a guest's browser wishlist (nothing is saved).
// Registered BEFORE router.use(protect), so it doesn't need a signed-in user.
router.post('/preview', cartPreviewLimiter, guestWishlistRules, handleValidation, wishlistController.previewWishlist)

// Like the cart: the wishlist always belongs to req.user, so no route ever
// takes a user id from the request.
router.use(protect)

router.get('/', wishlistController.getWishlist)
// Before '/:productId', so "merge" is never mistaken for a product id.
router.post('/merge', guestWishlistRules, handleValidation, wishlistController.mergeWishlist)
router.post('/:productId', wishlistProductRules, handleValidation, wishlistController.addToWishlist)
router.delete('/:productId', wishlistProductRules, handleValidation, wishlistController.removeFromWishlist)

export default router
