import { Router } from 'express'
import * as dashboardController from '../controllers/dashboardController.js'
import { protect } from '../middleware/protect.js'
import { requireAdmin } from '../middleware/authorize.js'
import { adminScope } from '../middleware/shopScope.js'

const router = Router()

// Marketplace-wide numbers are for the admin only. (Sellers get their own
// shop's numbers from /api/seller/dashboard.)
router.get('/dashboard', protect, requireAdmin, adminScope, dashboardController.getDashboard)

export default router
