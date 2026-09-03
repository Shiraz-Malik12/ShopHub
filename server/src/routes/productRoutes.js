import { Router } from 'express'
import * as productController from '../controllers/productController.js'
import { protect } from '../middleware/protect.js'
import { requireAdmin } from '../middleware/authorize.js'
import {
  createProductRules,
  updateProductRules,
  productIdRules,
  handleValidation,
} from '../validators/productValidators.js'

const router = Router()

router.get('/admin', protect, requireAdmin, productController.listAllProducts)
router.get('/admin/:id', protect, requireAdmin, productIdRules, handleValidation, productController.getProductAdmin)
router.get('/', productController.listActiveProducts)
router.get('/:id', productIdRules, handleValidation, productController.getProduct)

router.post('/', protect, requireAdmin, createProductRules, handleValidation, productController.createProduct)
router.patch(
  '/:id',
  protect,
  requireAdmin,
  updateProductRules,
  handleValidation,
  productController.updateProduct,
)
router.delete(
  '/:id',
  protect,
  requireAdmin,
  productIdRules,
  handleValidation,
  productController.deactivateProduct,
)

export default router
