import Category from '../models/Category.js'

// What a customer is allowed to see: the product must be active AND sit in
// an active category. Hiding a category should hide its products too — the
// backend enforces this, not the storefront, so no client can bypass it.
// Shared by the product listing and the cart so both apply the same rule.
//
// Optional categoryId narrows the result to that one category (the
// storefront's category filter); an inactive or unknown id matches nothing.
export async function customerVisibleFilter(categoryId) {
  const categoryQuery = { isActive: true }
  if (categoryId) categoryQuery._id = categoryId
  const activeCategoryIds = await Category.find(categoryQuery).distinct('_id')
  return { isActive: true, category: { $in: activeCategoryIds } }
}
