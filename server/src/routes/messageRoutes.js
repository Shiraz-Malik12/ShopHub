import { Router } from "express";
import { contactLimiter } from "../middleware/rateLimiters.js";
import { createMessageRules, handleValidation } from "../validators/messageValidators.js";
import { createMessage } from "../controllers/messageController.js";

const router = Router()

router.post('/',contactLimiter, createMessageRules, handleValidation,createMessage);

export default router
