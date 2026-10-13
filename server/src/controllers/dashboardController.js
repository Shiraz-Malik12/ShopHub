import Order, { ORDER_STATUSES } from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'

// A product with this many (or fewer) left is listed as "low stock".
export const LOW_STOCK_THRESHOLD = 5
const RECENT_ORDERS_LIMIT = 5
const LOW_STOCK_LIMIT = 8

// GET /api/admin/dashboard — admin-only. Everything the dashboard shows,
// in one request. All numbers are counted by the database, not by loading
// every order into memory.
export async function getDashboard(req, res, next) {
  try {
    const [statusGroups, activeProducts, customers, recentOrders, lowStockProducts] = await Promise.all([
      // One row per status: how many orders, and how much money.
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }]),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'customer' }),
      Order.find({})
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(RECENT_ORDERS_LIMIT)
        .select('orderNumber user total itemCount status createdAt'),
      Product.find({ isActive: true, stock: { $lte: LOW_STOCK_THRESHOLD } })
        .populate('category', 'name')
        .sort({ stock: 1, name: 1 })
        .limit(LOW_STOCK_LIMIT)
        .select('name stock images category'),
    ])

    // Every status appears in the answer, even with zero orders.
    const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0]))
    let totalOrders = 0
    let totalSales = 0
    for (const group of statusGroups) {
      ordersByStatus[group._id] = group.count
      totalOrders += group.count
      // Cancelled orders are not sales — nothing is delivered or paid.
      if (group._id !== 'cancelled') totalSales += group.total
    }

    res.status(200).json({
      stats: {
        totalSales,
        totalOrders,
        pendingOrders: ordersByStatus.pending,
        activeProducts,
        customers,
      },
      ordersByStatus,
      recentOrders,
      lowStockProducts: lowStockProducts.map((product) => ({
        _id: product._id,
        name: product.name,
        stock: product.stock,
        image: product.images[0]?.url || null,
        category: product.category?.name || null,
      })),
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    })
  } catch (err) {
    next(err)
  }
}
