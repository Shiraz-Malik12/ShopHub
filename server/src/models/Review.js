import mongoose from 'mongoose'

export const MAX_COMMENT_LENGTH = 1000

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    comment: { type: String, trim: true, maxlength: MAX_COMMENT_LENGTH, default: '' },
  },
  { timestamps: true },
)

// One review per customer per product: the database itself refuses a second
// one, so it can't happen even if two requests arrive at the same moment.
reviewSchema.index({ product: 1, user: 1 }, { unique: true })

export default mongoose.model('Review', reviewSchema)
