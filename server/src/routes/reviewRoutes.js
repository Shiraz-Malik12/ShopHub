import { Router } from 'express'
import * as reviewController from '../controllers/reviewController.js'
import { protect } from '../middleware/protect.js'
import { requireAdmin } from '../middleware/authorize.js'
import { productParamRules, saveReviewRules, reviewIdRules, handleValidation } from '../validators/reviewValidators.js'

// mergeParams: lets these routes read :productId from the parent path
// (/api/products/:productId/reviews), set up in app.js.
const router = Router({ mergeParams: true })

// Anyone can read reviews.
router.get('/', productParamRules, handleValidation, reviewController.listReviews)

// Writing needs a signed-in user; the review belongs to req.user (the token).
router.get('/me', protect, productParamRules, handleValidation, reviewController.getMyReviewStatus)
router.put('/', protect, saveReviewRules, handleValidation, reviewController.saveMyReview)
router.delete('/', protect, productParamRules, handleValidation, reviewController.deleteMyReview)

// Admins can remove any review.
router.delete('/:reviewId', protect, requireAdmin, reviewIdRules, handleValidation, reviewController.adminDeleteReview)

export default router
