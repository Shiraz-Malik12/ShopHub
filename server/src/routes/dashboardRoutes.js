import { Router } from 'express'
import * as dashboardController from '../controllers/dashboardController.js'
import { protect } from '../middleware/protect.js'
import { requireAdmin } from '../middleware/authorize.js'

const router = Router()

// Store-wide numbers are for the owner only.
router.get('/dashboard', protect, requireAdmin, dashboardController.getDashboard)

export default router
