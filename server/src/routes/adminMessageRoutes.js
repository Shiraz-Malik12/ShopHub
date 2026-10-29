import { Router } from "express";
import { handleValidation, messageIdRules } from "../validators/messageValidators.js";
import { getAllMessages, resolveMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/protect.js";
import { requireAdmin } from "../middleware/authorize.js";


const router = Router()

router.get('/', protect, requireAdmin, getAllMessages);
router.patch('/:id/resolve', protect, requireAdmin, messageIdRules, handleValidation, resolveMessage);

export default router
