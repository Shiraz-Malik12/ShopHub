import mongoose from 'mongoose'

export const SHOP_STATUSES = ['pending', 'approved', 'rejected', 'suspended']

// Which status the ADMIN may move a shop to next. (The owner can also move
// a 'rejected' shop back to 'pending' by fixing and resubmitting it — see
// shopController.updateMyShop.)
//   pending   → approved or rejected   (review a new application)
//   approved  → suspended              (stop a shop that breaks the rules)
//   suspended → approved               (let it sell again)
//   rejected  → nothing                (waits for the owner to resubmit)
export const NEXT_SHOP_STATUSES = {
  pending: ['approved', 'rejected'],
  approved: ['suspended'],
  suspended: ['approved'],
  rejected: [],
}

// Slugs the shop page URL (/shops/:slug) or the API could confuse with a
// real word in a route, e.g. GET /api/shops/mine.
export const RESERVED_SHOP_SLUGS = ['mine', 'admin', 'new', 'edit', 'apply', 'shophub']

// One seller's shop inside the ShopHub marketplace. The User stays the
// login (email, password); the Shop is the business they run. Kept as its
// own collection — not fields on User — because later products, orders
// and coupons will all point at a shop, not at a person.
const shopSchema = new mongoose.Schema(
  {
    // unique: one shop per user. Also lets us find "my shop" by owner fast.
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    // Made from `name` by the controller (see slugify.js), never sent by the
    // browser. The unique index is what really stops two shops having the
    // same name — even "Ali Store" vs "ali-store!" end up as the same slug.
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    status: { type: String, enum: SHOP_STATUSES, default: 'pending', index: true },
    // The admin's note when rejecting or suspending ("Please add a real
    // phone number"). Shown to the owner so they know what to fix.
    statusReason: { type: String, trim: true, maxlength: 300, default: '' },
    // When the admin last approved/rejected/suspended it.
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

export default mongoose.model('Shop', shopSchema)
