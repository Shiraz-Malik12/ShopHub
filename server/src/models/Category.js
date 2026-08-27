import mongoose from 'mongoose'

const MAX_NAME_LENGTH = 60

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: MAX_NAME_LENGTH },
    // Always derived from `name` by the controller (see slugify.js) — never
    // taken directly from the request body. Unique index is what actually
    // prevents duplicate categories (two names that only differ by case or
    // spacing still collide once slugified).
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Soft-delete flag. A category with products under it is never hard-
    // deleted — see categoryController.js for why — so "delete" in the API
    // means "set this to false", not "remove the document".
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('Category', categorySchema)
