import { Router } from 'express'
import * as orderController from '../controllers/orderController.js'
import { protect } from '../middleware/protect.js'
import { requireAdmin } from '../middleware/authorize.js'
import {
  placeOrderRules,
  orderIdRules,
  updateOrderStatusRules,
  listOrdersRules,
  handleValidation,
} from '../validators/orderValidators.js'

const router = Router()

// Every order route needs a signed-in user.
router.use(protect)

// "/mine" and "/admin" are registered before "/:id" on purpose — otherwise
// Express would treat the words "mine"/"admin" as an order id.
router.get('/mine', orderController.listMyOrders)
router.get('/admin', requireAdmin, listOrdersRules, handleValidation, orderController.listAllOrders)

router.post('/', placeOrderRules, handleValidation, orderController.placeOrder)
router.get('/:id', orderIdRules, handleValidation, orderController.getOrder)
router.patch('/:id/cancel', orderIdRules, handleValidation, orderController.cancelMyOrder)
router.patch(
  '/:id/status',
  requireAdmin,
  updateOrderStatusRules,
  handleValidation,
  orderController.updateOrderStatus,
)

export default router
