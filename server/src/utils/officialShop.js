import Shop from '../models/Shop.js'
import User from '../models/User.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'

const OFFICIAL_SHOP = {
  name: 'ShopHub Official',
  slug: 'shophub-official',
  description: 'Products sold by ShopHub itself.',
  // Required fields for every shop; the admin can change them later.
  phone: 'Not set',
  city: 'Online',
}

// The marketplace's own shop, or null if there's no admin yet to own it.
// Created the first time it's needed, already approved.
export async function getOfficialShop() {
  const existing = await Shop.findOne({ isOfficial: true })
  if (existing) return existing

  // The first admin ever created (from `npm run seed:admin`) owns it.
  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 })
  if (!admin) return null

  return Shop.create({ ...OFFICIAL_SHOP, owner: admin._id, status: 'approved', isOfficial: true, reviewedAt: new Date() })
}

// One-time move from "one shop" to "marketplace": every product made before
// products had a shop is given to ShopHub Official. Runs on every server
// start, but after the first time there is nothing left to move, so it only
// costs one quick count.
export async function assignShoplessProducts() {
  const shopless = { $or: [{ shop: { $exists: false } }, { shop: null }] }
  const count = await Product.countDocuments(shopless)
  if (count === 0) return

  const official = await getOfficialShop()
  if (!official) {
    console.warn(`[shops] ${count} product(s) have no shop yet. Run "npm run seed:admin", then restart the server.`)
    return
  }
  const { modifiedCount } = await Product.updateMany(shopless, { $set: { shop: official._id } })
  console.log(`[shops] Moved ${modifiedCount} existing product(s) into "${official.name}".`)
}

// Same one-time move for orders: everything ordered before the marketplace
// was bought from the one original shop, so it belongs to ShopHub Official.
// Each old order was its own checkout, so its checkoutId is its own number.
export async function assignShoplessOrders() {
  const shopless = { $or: [{ shop: { $exists: false } }, { shop: null }] }
  const count = await Order.countDocuments(shopless)
  if (count === 0) return

  const official = await getOfficialShop()
  if (!official) {
    console.warn(`[shops] ${count} order(s) have no shop yet. Run "npm run seed:admin", then restart the server.`)
    return
  }
  // The [ ] form ("update pipeline") lets checkoutId copy each order's OWN
  // orderNumber ('$orderNumber') instead of one fixed value for all.
  const { modifiedCount } = await Order.updateMany(shopless, [
    { $set: { shop: official._id, shopName: official.name, checkoutId: '$orderNumber' } },
  ])
  console.log(`[shops] Moved ${modifiedCount} existing order(s) into "${official.name}".`)
}
