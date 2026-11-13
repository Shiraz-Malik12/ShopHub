import Category from '../models/Category.js'
import Shop from '../models/Shop.js'
import User from '../models/User.js'

// The shops whose products customers may see and buy: approved, and owned
// by someone who isn't blocked. Suspending a shop, or blocking its owner,
// takes all its products off the store at once.
export async function sellingShopIds() {
  const blockedUserIds = await User.find({ isBlocked: true }).distinct('_id')
  return Shop.find({ status: 'approved', owner: { $nin: blockedUserIds } }).distinct('_id')
}

// For code that already has a product loaded (cart, checkout): is its shop
// one of the selling ones? Pass the list from sellingShopIds().
export function isFromSellingShop(product, shopIds) {
  return shopIds.some((id) => id.equals(product.shop?._id || product.shop))
}

// What a customer is allowed to see: the product must be active, sit in an
// active category, AND belong to a shop that is selling (see above). Hiding
// a category or a shop hides its products too — the backend enforces this,
// not the storefront, so no client can bypass it. Shared by the product
// listing, cart, wishlist and reviews so all apply the same rule.
//
// Optional categoryId narrows the result to that one category (the
// storefront's category filter); an inactive or unknown id matches nothing.
export async function customerVisibleFilter(categoryId) {
  const categoryQuery = { isActive: true }
  if (categoryId) categoryQuery._id = categoryId
  const [activeCategoryIds, shopIds] = await Promise.all([
    Category.find(categoryQuery).distinct('_id'),
    sellingShopIds(),
  ])
  return { isActive: true, category: { $in: activeCategoryIds }, shop: { $in: shopIds } }
}
