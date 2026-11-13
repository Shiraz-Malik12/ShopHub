import { Router } from 'express'
import * as productController from '../controllers/productController.js'
import * as productImageController from '../controllers/productImageController.js'
import * as sellerShopController from '../controllers/sellerShopController.js'
import { updateSellerShopRules } from '../validators/shopValidators.js'
import { protect } from '../middleware/protect.js'
import { requireSeller } from '../middleware/productScope.js'
import { uploadProductImages, uploadSingleProductImage } from '../middleware/uploadImages.js'
import {
  createProductRules,
  updateProductRules,
  productIdRules,
  productImageIdRules,
  handleValidation,
} from '../validators/productValidators.js'

const router = Router()

// The seller panel. Same controllers as the admin's product pages, but
// requireSeller limits every query to the seller's own shop. It runs before
// Multer, so a non-seller's upload is refused without being read.
router.use(protect, requireSeller)

// The seller's own shop profile (and the panel header's shop name).
router.get('/shop', sellerShopController.getSellerShop)
router.patch('/shop', updateSellerShopRules, handleValidation, sellerShopController.updateSellerShop)
router.put('/shop/logo', uploadSingleProductImage, sellerShopController.setShopLogo)
router.delete('/shop/logo', sellerShopController.removeShopLogo)

router.get('/products', productController.listAllProducts)
router.get('/products/:id', productIdRules, handleValidation, productController.getProductAdmin)
router.post('/products', createProductRules, handleValidation, productController.createProduct)
router.patch('/products/:id', updateProductRules, handleValidation, productController.updateProduct)
router.delete('/products/:id', productIdRules, handleValidation, productController.deactivateProduct)

router.post(
  '/products/:id/images',
  productIdRules,
  handleValidation,
  uploadProductImages,
  productImageController.addProductImages,
)
router.put(
  '/products/:id/images/:imageId',
  productImageIdRules,
  handleValidation,
  uploadSingleProductImage,
  productImageController.replaceProductImage,
)
router.delete(
  '/products/:id/images/:imageId',
  productImageIdRules,
  handleValidation,
  productImageController.removeProductImage,
)

export default router
