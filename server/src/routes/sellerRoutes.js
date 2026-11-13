import { Router } from 'express'
import * as productController from '../controllers/productController.js'
import * as productImageController from '../controllers/productImageController.js'
import * as sellerShopController from '../controllers/sellerShopController.js'
import * as orderController from '../controllers/orderController.js'
import { listOrdersRules, updateOrderStatusRules } from '../validators/orderValidators.js'
import * as couponController from '../controllers/couponController.js'
import * as dashboardController from '../controllers/dashboardController.js'
import { createCouponRules, updateCouponRules, couponIdRules } from '../validators/couponValidators.js'
import { updateSellerShopRules } from '../validators/shopValidators.js'
import { protect } from '../middleware/protect.js'
import { requireSeller } from '../middleware/shopScope.js'
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

// The seller's orders: only orders placed with THIS shop (requireSeller
// sets the scope). They see what to pack and where to send it, and move
// each order along — same rules as the admin (NEXT_STATUSES).
router.get('/orders', listOrdersRules, handleValidation, orderController.listAllOrders)
router.patch('/orders/:id/status', updateOrderStatusRules, handleValidation, orderController.updateOrderStatus)

// The seller's own coupons. They only discount this shop's products.
router.get('/coupons', couponController.listCoupons)
router.post('/coupons', createCouponRules, handleValidation, couponController.createCoupon)
router.patch('/coupons/:id', updateCouponRules, handleValidation, couponController.updateCoupon)
router.delete('/coupons/:id', couponIdRules, handleValidation, couponController.deleteCoupon)

// The seller's dashboard: the same numbers as the admin's, for this shop only.
router.get('/dashboard', dashboardController.getDashboard)

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
