import { body, param } from "express-validator";
import { handleValidation } from './handleValidation.js'

export { handleValidation }


export const createMessageRules = [
    body("name")
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
    body("email")
    .isString()
    .withMessage("Email must be a string")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .notEmpty()
    .withMessage("Email is required")
    .isLength({ min: 1, max: 80 })
    .withMessage("Email must be between 1 and 80 characters")
    .normalizeEmail(),
    body("message")
    .isString()
    .withMessage("Message must be a string")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1 and 1000 characters")
];
export const messageIdRules = [
    param("id")
    .isMongoId()
    .withMessage("Invalid message id")
];