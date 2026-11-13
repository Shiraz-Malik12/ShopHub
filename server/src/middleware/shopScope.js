import Shop from '../models/Shop.js'

// Products, orders, coupons and the dashboard are each shared by two panels
// that must see different things:
//   admin  → every shop's (to run the marketplace)
//   seller → ONLY their own shop's
// These middlewares set `req.shopScope`, a filter the controllers add to
// EVERY query (via shopScopeOf). A seller asking for another shop's product,
// order or coupon by id just gets "not found" — the query can't reach it.
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
    req.shopScope = { shop: shop._id }
    next()
  } catch (err) {
    next(err)
  }
}

// Admin routes: no limit. (requireAdmin has already checked the role.)
// Things the admin creates go to ShopHub Official (products) or the whole
// site (coupons) — see the controllers.
export function adminScope(req, res, next) {
  req.shopScope = {}
  next()
}

// Used by the controllers. Refuses to run without a scope, so a route that
// forgot the middleware fails loudly instead of quietly showing everything.
export function shopScopeOf(req) {
  if (!req.shopScope) throw new Error('This route is missing requireSeller or adminScope')
  return req.shopScope
}
