import { Router } from 'express'
import * as categoryController from '../controllers/categoryController.js'
import { protect } from '../middleware/protect.js'
import { requireAdmin } from '../middleware/authorize.js'
import {
  createCategoryRules,
  updateCategoryRules,
  deleteCategoryRules,
  handleValidation,
} from '../validators/categoryValidators.js'

const router = Router()

// Registered before "/:idOrSlug" on purpose — Express matches routes in
// order, so if this came after, a request for /categories/admin would be
// caught by the :idOrSlug route instead, with "admin" treated as a slug.
router.get('/admin', protect, requireAdmin, categoryController.listAllCategories)

router.get('/', categoryController.listActiveCategories)
router.get('/:idOrSlug', categoryController.getCategory)

router.post('/', protect, requireAdmin, createCategoryRules, handleValidation, categoryController.createCategory)
router.patch(
  '/:id',
  protect,
  requireAdmin,
  updateCategoryRules,
  handleValidation,
  categoryController.updateCategory,
)
router.delete(
  '/:id',
  protect,
  requireAdmin,
  deleteCategoryRules,
  handleValidation,
  categoryController.deactivateCategory,
)

export default router
