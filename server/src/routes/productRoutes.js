import { Router } from 'express'
import * as productController from '../controllers/productController.js'
import * as productImageController from '../controllers/productImageController.js'
import { protect } from '../middleware/protect.js'
import { requireAdmin } from '../middleware/authorize.js'
import { uploadProductImages, uploadSingleProductImage } from '../middleware/uploadImages.js'
import {
  createProductRules,
  updateProductRules,
  productIdRules,
  productImageIdRules,
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

// Image routes: protect + requireAdmin run *before* Multer, so a file sent
// by a guest or customer is rejected without ever being read into memory.
router.post(
  '/:id/images',
  protect,
  requireAdmin,
  productIdRules,
  handleValidation,
  uploadProductImages,
  productImageController.addProductImages,
)
router.put(
  '/:id/images/:imageId',
  protect,
  requireAdmin,
  productImageIdRules,
  handleValidation,
  uploadSingleProductImage,
  productImageController.replaceProductImage,
)
router.delete(
  '/:id/images/:imageId',
  protect,
  requireAdmin,
  productImageIdRules,
  handleValidation,
  productImageController.removeProductImage,
)

export default router
