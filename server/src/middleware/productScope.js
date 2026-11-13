import Shop from '../models/Shop.js'

// Product management is shared by two panels that see different things:
//   admin  → every product of every shop (to moderate the marketplace)
//   seller → ONLY the products of their own shop
// These middlewares set `req.productScope`, a filter the product
// controllers add to EVERY query. A seller asking for another shop's
// product by id just gets "not found" — the query can't reach it.
// Both must run after `protect`.

// Seller routes: you must be a seller with an APPROVED shop. A suspended
// shop (or a role that's out of date) is turned away here, even if the
// browser still shows the seller panel.
export async function requireSeller(req, res, next) {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can do this.' })
    }
    const shop = await Shop.findOne({ owner: req.user._id, status: 'approved' })
    if (!shop) {
      return res.status(403).json({ message: 'Your shop is not approved, so it cannot sell right now.' })
    }
    req.shop = shop
    req.productScope = { shop: shop._id }
    next()
  } catch (err) {
    next(err)
  }
}

// Admin routes: no limit. (requireAdmin has already checked the role.)
// New products the admin creates go to ShopHub Official — see createProduct.
export function adminProductScope(req, res, next) {
  req.productScope = {}
  next()
}

// Used by the controllers. Refuses to run without a scope, so a route that
// forgot the middleware fails loudly instead of quietly showing everything.
export function productScopeOf(req) {
  if (!req.productScope) throw new Error('Product route is missing requireSeller or adminProductScope')
  return req.productScope
}
