import Shop, { NEXT_SHOP_STATUSES, RESERVED_SHOP_SLUGS, SHOP_STATUSES } from '../models/Shop.js'
import User, { SHOPPER_ROLES } from '../models/User.js'
import Product from '../models/Product.js'
import { slugify } from '../utils/slugify.js'
import { customerVisibleFilter, sellingShopIds } from '../utils/customerVisibleFilter.js'
import { sendShopDecisionEmail } from '../utils/shopEmails.js'

export const DEFAULT_SHOP_PAGE_SIZE = 10

// The fields an owner may fill in. Status, slug and owner are never taken
// from the request — the server decides those.
const EDITABLE_FIELDS = ['name', 'description', 'phone', 'city']

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Turns the shop name into its web address and refuses names that would
// clash with a route (see RESERVED_SHOP_SLUGS).
function slugForName(name) {
  const slug = slugify(name)
  if (RESERVED_SHOP_SLUGS.includes(slug)) {
    throw fail(409, 'This shop name is not available. Please choose another.')
  }
  return slug
}

// MongoDB refuses a second shop with the same slug or the same owner
// (unique indexes). Turn that into a message a person can act on.
function duplicateShopError(err) {
  if (err.code !== 11000) return err
  if (err.keyPattern?.owner) return fail(409, 'You already have a shop.')
  return fail(409, 'A shop with this name already exists. Please choose another name.')
}

// What the browser gets to see about a shop.
function toShop(shop) {
  return {
    id: shop._id,
    name: shop.name,
    slug: shop.slug,
    description: shop.description,
    phone: shop.phone,
    city: shop.city,
    status: shop.status,
    statusReason: shop.statusReason,
    reviewedAt: shop.reviewedAt,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
  }
}

// ---------------------------------------------------------------------------
// The shop owner's side: /api/shops/mine
// ---------------------------------------------------------------------------

// GET /api/shops/mine — my shop application, or null if I haven't applied.
export async function getMyShop(req, res, next) {
  try {
    const shop = await Shop.findOne({ owner: req.user._id })
    res.status(200).json({ shop: shop ? toShop(shop) : null })
  } catch (err) {
    next(err)
  }
}

// POST /api/shops — apply to open a shop. It starts as 'pending' and can't
// sell anything until the admin approves it.
export async function applyForShop(req, res, next) {
  try {
    const { name, description = '', phone, city } = req.body

    const shop = await Shop.create({
      owner: req.user._id,
      name,
      slug: slugForName(name),
      description,
      phone,
      city,
    })

    res.status(201).json({ message: 'Shop application sent', shop: toShop(shop) })
  } catch (err) {
    next(duplicateShopError(err))
  }
}

// PATCH /api/shops/mine — change my application before it's approved.
// Changing a REJECTED application sends it back to the admin as 'pending'.
// Once a shop is approved its details are managed from the seller panel
// (coming in Phase 2), not from this application form.
export async function updateMyShop(req, res, next) {
  try {
    const shop = await Shop.findOne({ owner: req.user._id })
    if (!shop) throw fail(404, "You haven't applied for a shop yet.")
    if (!['pending', 'rejected'].includes(shop.status)) {
      throw fail(409, 'Your shop has already been reviewed, so the application can no longer be changed.')
    }

    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) shop[field] = req.body[field]
    }
    if (shop.isModified('name')) shop.slug = slugForName(shop.name)

    const wasRejected = shop.status === 'rejected'
    if (wasRejected) {
      shop.status = 'pending'
      shop.statusReason = ''
      shop.reviewedAt = null
    }

    await shop.save()
    res.status(200).json({
      message: wasRejected ? 'Shop application sent again' : 'Shop application updated',
      shop: toShop(shop),
    })
  } catch (err) {
    next(duplicateShopError(err))
  }
}

// ---------------------------------------------------------------------------
// Public: /api/shops/:slug — the shop page customers see
// ---------------------------------------------------------------------------

// GET /api/shops/ali-electronics
// Only shops that are selling right now (approved, owner not blocked) can be
// opened; anything else is "not found", so a suspended shop's page is gone
// too. The phone number is NOT included — it's for ShopHub, not the public.
export async function getPublicShop(req, res, next) {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug, _id: { $in: await sellingShopIds() } })
    if (!shop) throw fail(404, 'Shop not found.')

    const productCount = await Product.countDocuments({ ...(await customerVisibleFilter()), shop: shop._id })
    res.status(200).json({
      shop: {
        id: shop._id,
        name: shop.name,
        slug: shop.slug,
        description: shop.description,
        city: shop.city,
        logo: shop.logo?.url || null,
        isOfficial: shop.isOfficial,
        joinedAt: shop.createdAt,
        productCount,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// The admin's side: /api/admin/shops
// ---------------------------------------------------------------------------

// How many shops are in each status — the numbers on the Shops page tabs.
async function countShopsByStatus() {
  const groups = await Shop.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  const counts = Object.fromEntries(SHOP_STATUSES.map((status) => [status, 0]))
  for (const group of groups) counts[group._id] = group.count
  return counts
}

// GET /api/admin/shops?status=pending&search=ali&page=1&limit=10
// Search matches the shop's name or city, or its owner's name or email.
export async function listShops(req, res, next) {
  try {
    const { status, search } = req.query
    const page = req.query.page || 1
    const limit = req.query.limit || DEFAULT_SHOP_PAGE_SIZE

    const filter = {}
    if (status) filter.status = status
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i')
      const owners = await User.find({ $or: [{ name: pattern }, { email: pattern }] })
        .select('_id')
        .limit(200)
      filter.$or = [{ name: pattern }, { city: pattern }, { owner: { $in: owners.map((owner) => owner._id) } }]
    }

    // Applications waiting for review: oldest first, so nobody waits
    // forever. Every other list: newest first.
    const sort = status === 'pending' ? { createdAt: 1, _id: 1 } : { createdAt: -1, _id: -1 }

    const [total, shops, counts] = await Promise.all([
      Shop.countDocuments(filter),
      Shop.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('owner', 'name email isBlocked'),
      countShopsByStatus(),
    ])

    res.status(200).json({
      shops: shops.map((shop) => ({
        ...toShop(shop),
        // null if the owner's account was deleted.
        owner: shop.owner
          ? { id: shop.owner._id, name: shop.owner.name, email: shop.owner.email, isBlocked: Boolean(shop.owner.isBlocked) }
          : null,
      })),
      counts,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/admin/shops/:id/status  { status: 'approved' | 'rejected' | 'suspended', reason }
export async function setShopStatus(req, res, next) {
  try {
    const { status } = req.body
    const reason = status === 'approved' ? '' : req.body.reason

    // Every status the shop may move to `status` FROM (see NEXT_SHOP_STATUSES).
    // Putting it in the filter makes the check and the change one step, so
    // two admins clicking at the same moment can't both "win".
    const allowedFrom = Object.keys(NEXT_SHOP_STATUSES).filter((from) => NEXT_SHOP_STATUSES[from].includes(status))

    const shop = await Shop.findOneAndUpdate(
      { _id: req.params.id, status: { $in: allowedFrom } },
      { $set: { status, statusReason: reason, reviewedAt: new Date() } },
      { new: true },
    )
    if (!shop) {
      const current = await Shop.findById(req.params.id).select('status')
      if (!current) throw fail(404, 'Shop not found.')
      throw fail(409, `A shop that is ${current.status} can't be ${status}.`)
    }

    // The owner's role follows their shop: an approved shop makes them a
    // seller, anything else makes them a plain customer again. The role
    // filter means an admin's role is never touched.
    const owner = await User.findOneAndUpdate(
      { _id: shop.owner, role: { $in: SHOPPER_ROLES } },
      { $set: { role: status === 'approved' ? 'seller' : 'customer' } },
      { new: true },
    )

    // Tell the owner (in the background — never delays or breaks the request).
    sendShopDecisionEmail(shop, owner).catch((err) => console.error('[email] Could not send shop email:', err.message))

    res.status(200).json({ message: `${shop.name} is now ${status}`, shop: toShop(shop) })
  } catch (err) {
    next(err)
  }
}
