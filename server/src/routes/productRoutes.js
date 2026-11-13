import { Router } from 'express'
import * as productController from '../controllers/productController.js'
import * as productImageController from '../controllers/productImageController.js'
import { protect } from '../middleware/protect.js'
import { requireAdmin } from '../middleware/authorize.js'
import { adminScope } from '../middleware/shopScope.js'
import { uploadProductImages, uploadSingleProductImage } from '../middleware/uploadImages.js'
import {
  createProductRules,
  updateProductRules,
  productIdRules,
  productImageIdRules,
  listProductsRules,
  handleValidation,
} from '../validators/productValidators.js'

const router = Router()

router.get('/admin', protect, requireAdmin, adminScope, productController.listAllProducts)
router.get('/admin/:id', protect, requireAdmin, adminScope, productIdRules, handleValidation, productController.getProductAdmin)
router.get('/', listProductsRules, handleValidation, productController.listActiveProducts)
router.get('/:id', productIdRules, handleValidation, productController.getProduct)

router.post('/', protect, requireAdmin, adminScope, createProductRules, handleValidation, productController.createProduct)
router.patch(
  '/:id',
  protect,
  requireAdmin,
  adminScope,
  updateProductRules,
  handleValidation,
  productController.updateProduct,
)
router.delete(
  '/:id',
  protect,
  requireAdmin,
  adminScope,
  productIdRules,
  handleValidation,
  productController.deactivateProduct,
)

// Image routes: protect + requireAdmin run *before* Multer, so a file sent
// by a guest or customer is rejected without ever being read into memory.
router.post(
  '/:id/images',
  protect,
  requireAdmin,
  adminScope,
  productIdRules,
  handleValidation,
  uploadProductImages,
  productImageController.addProductImages,
)
router.put(
  '/:id/images/:imageId',
  protect,
  requireAdmin,
  adminScope,
  productImageIdRules,
  handleValidation,
  uploadSingleProductImage,
  productImageController.replaceProductImage,
)
router.delete(
  '/:id/images/:imageId',
  protect,
  requireAdmin,
  adminScope,
  productImageIdRules,
  handleValidation,
  productImageController.removeProductImage,
)

export default router
