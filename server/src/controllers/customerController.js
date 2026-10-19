import User from '../models/User.js'
import Order from '../models/Order.js'

export const DEFAULT_CUSTOMER_PAGE_SIZE = 10
const CUSTOMER_ORDERS_LIMIT = 50

// Same idea as in productController: typed search text is matched literally.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

// For each customer, look up their orders and boil them down to three
// numbers. Cancelled orders count as orders, but not as money spent.
const orderStatsLookup = {
  $lookup: {
    from: 'orders',
    localField: '_id',
    foreignField: 'user',
    pipeline: [
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          totalSpent: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 0, '$total'] } },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
    ],
    as: 'orderStats',
  },
}

// What the admin may see about a customer — never the password hash, OTP
// or refresh token (those aren't even selected).
function toCustomer(user, stats) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isVerified: user.isVerified,
    isBlocked: Boolean(user.isBlocked),
    blockedAt: user.blockedAt || null,
    createdAt: user.createdAt,
    orderCount: stats?.orderCount || 0,
    totalSpent: stats?.totalSpent || 0,
    lastOrderAt: stats?.lastOrderAt || null,
  }
}

// GET /api/admin/customers?search=ali&status=blocked&page=2&limit=10
// Admins are not listed: this page is only about shoppers.
export async function listCustomers(req, res, next) {
  try {
    const { search, status } = req.query
    const page = req.query.page || 1
    const limit = req.query.limit || DEFAULT_CUSTOMER_PAGE_SIZE

    const filter = { role: 'customer' }
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i')
      filter.$or = [{ name: pattern }, { email: pattern }]
    }
    if (status === 'blocked') filter.isBlocked = true
    if (status === 'active') filter.isBlocked = { $ne: true }

    // Count and fetch at the same time — neither waits for the other.
    const [total, rows] = await Promise.all([
      User.countDocuments(filter),
      User.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1, _id: -1 } }, // newest first; _id breaks ties
        { $skip: (page - 1) * limit },
        { $limit: limit },
        orderStatsLookup, // only for the customers on THIS page
        { $project: { name: 1, email: 1, isVerified: 1, isBlocked: 1, blockedAt: 1, createdAt: 1, orderStats: 1 } },
      ]),
    ])

    res.status(200).json({
      customers: rows.map((row) => toCustomer(row, row.orderStats[0])),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/admin/customers/:id — one customer, their saved address and orders.
export async function getCustomer(req, res, next) {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'customer' })
    if (!user) throw fail(404, 'Customer not found.')

    const [orders, [stats]] = await Promise.all([
      Order.find({ user: user._id })
        .sort({ createdAt: -1, _id: -1 })
        .limit(CUSTOMER_ORDERS_LIMIT)
        .select('orderNumber status total itemCount createdAt'),
      Order.aggregate([{ $match: { user: user._id } }, ...orderStatsLookup.$lookup.pipeline]),
    ])

    res.status(200).json({
      customer: { ...toCustomer(user, stats), savedAddress: user.savedAddress || null },
      orders,
    })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/admin/customers/:id/block  { blocked: true | false }
// Blocking also deletes their saved session, so every device they're
// signed in on is logged out right away.
export async function setCustomerBlocked(req, res, next) {
  try {
    const update = req.body.blocked
      ? { $set: { isBlocked: true, blockedAt: new Date() }, $unset: { refreshTokenHash: 1 } }
      : { $set: { isBlocked: false }, $unset: { blockedAt: 1 } }

    // role: 'customer' in the filter means an admin can never block another
    // admin (or themselves) — such an id simply isn't found.
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'customer' }, update, { new: true })
    if (!user) throw fail(404, 'Customer not found.')

    res.status(200).json({
      message: user.isBlocked ? 'Customer blocked' : 'Customer unblocked',
      customer: { isBlocked: user.isBlocked, blockedAt: user.blockedAt || null },
    })
  } catch (err) {
    next(err)
  }
}
