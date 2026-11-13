import Product from '../models/Product.js'
import Category from '../models/Category.js'
import { customerVisibleFilter } from '../utils/customerVisibleFilter.js'
import { shopScopeOf } from '../middleware/shopScope.js'
import { getOfficialShop } from '../utils/officialShop.js'

// What the create form may set. `shop`, ratings and images are not here:
// the server sets those itself.
const CREATE_FIELDS = ['name', 'description', 'price', 'stock', 'category', 'isActive']

// What shoppers see about the shop selling a product ("Sold by ..."). Not the
// phone number or status, and only the logo's address, not its storage id.
const PUBLIC_SHOP_FIELDS = 'name slug isOfficial logo.url'

async function findActiveCategory(categoryId) {
  return Category.findOne({ _id: categoryId, isActive: true })
}

// The sort options the storefront may ask for (?sort=...). Anything else is
// rejected by listProductsRules, so a client can't sort by arbitrary fields.
// Every sort ends with _id: when two products tie (same price, same moment),
// _id puts them in a fixed order, so a product never shows up on two pages
// or on none when the customer moves between pages.
export const PRODUCT_SORTS = {
  newest: { createdAt: -1, _id: -1 },
  'price-asc': { price: 1, _id: 1 },
  'price-desc': { price: -1, _id: -1 },
  name: { name: 1, _id: 1 },
  rating: { ratingAverage: -1, ratingCount: -1, _id: -1 },
}

export const DEFAULT_PAGE_SIZE = 8

// Typed text goes into a regular expression, so characters that mean
// something special there (like . * + ? ( ) are escaped to be matched
// literally — searching "c++" must not crash or match everything.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// GET /api/products?search=iphone&category=<id>&sort=price-asc&inStock=true&page=2&limit=8
// All optional; with none, this returns the first page of visible products.
export async function listActiveProducts(req, res, next) {
  try {
    const { search, category, sort, inStock, shop } = req.query
    const page = req.query.page || 1
    const limit = req.query.limit || DEFAULT_PAGE_SIZE
    const filter = await customerVisibleFilter(category)

    // The shop page: narrow "every selling shop" down to this one. A shop
    // that isn't selling drops out of the list, so it matches nothing.
    if (shop) {
      filter.shop.$in = filter.shop.$in.filter((id) => id.equals(shop))
    }

    if (search) {
      // 'i' = case-insensitive, so "iphone" finds "iPhone 16".
      const pattern = new RegExp(escapeRegex(search), 'i')
      filter.$or = [{ name: pattern }, { description: pattern }]
    }

    // "In stock only": hide sold-out products ($gt = greater than, so 0 is excluded).
    if (inStock === 'true') {
      filter.stock = { $gt: 0 }
    }

    // Two questions at once: this page's products, and how many match in total
    // (needed to know how many pages there are).
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('shop', PUBLIC_SHOP_FIELDS)
        .sort(PRODUCT_SORTS[sort] || PRODUCT_SORTS.newest)
        .skip((page - 1) * limit) // page 3 with 8 per page → skip the first 16
        .limit(limit),
      Product.countDocuments(filter),
    ])

    res.status(200).json({
      products,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (err) {
    next(err)
  }
}

// The admin sees every shop's products; a seller only their own (see
// middleware/shopScope.js — every query below adds shopScopeOf(req)).
export async function listAllProducts(req, res, next) {
  try {
    const products = await Product.find(shopScopeOf(req))
      .populate('category', 'name slug isActive')
      .populate('shop', 'name slug status isOfficial')
      .sort({ createdAt: -1 })
    res.status(200).json({ products })
  } catch (err) {
    next(err)
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await Product.findOne({ _id: req.params.id, ...(await customerVisibleFilter()) })
      .populate('category', 'name slug')
      .populate('shop', PUBLIC_SHOP_FIELDS)
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }
    res.status(200).json({ product })
  } catch (err) {
    next(err)
  }
}
 

export async function getProductAdmin(req, res, next) {
  try {
    const product = await Product.findOne({ _id: req.params.id, ...shopScopeOf(req) }).populate(
      'category',
      'name slug isActive',
    )
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }
    res.status(200).json({ product })
  } catch (err) {
    next(err)
  }
}

export async function createProduct(req, res, next) {
  try {
    const category = await findActiveCategory(req.body.category)
    if (!category) {
      return res.status(400).json({ message: 'Category not found or inactive.' })
    }

    // A seller's product goes into their own shop; the admin's into
    // ShopHub Official. Never from the request body.
    const shop = req.shop || (await getOfficialShop())
    if (!shop) {
      return res.status(409).json({ message: 'There is no shop to add this product to.' })
    }

    // Only these fields are taken from the request. Copying the whole body
    // would let a seller set things like `shop` or `ratingAverage` themselves.
    const fields = Object.fromEntries(
      CREATE_FIELDS.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]),
    )
    const product = await Product.create({ ...fields, shop: shop._id })
    await product.populate([{ path: 'category', select: 'name slug' }, { path: 'shop', select: 'name slug status isOfficial' }])
    res.status(201).json({ message: 'Product created', product })
  } catch (err) {
    next(err)
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findOne({ _id: req.params.id, ...shopScopeOf(req) })
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    if (req.body.category !== undefined) {
      const category = await findActiveCategory(req.body.category)
      if (!category) {
        return res.status(400).json({ message: 'Category not found or inactive.' })
      }
    }

    const allowedFields = ['name', 'description', 'price', 'stock', 'category', 'isActive']
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field]
      }
    }

    await product.save()
    await product.populate([{ path: 'category', select: 'name slug isActive' }, { path: 'shop', select: 'name slug status isOfficial' }])
    res.status(200).json({ message: 'Product updated', product })
  } catch (err) {
    next(err)
  }
}

export async function deactivateProduct(req, res, next) {
  try {
    const product = await Product.findOne({ _id: req.params.id, ...shopScopeOf(req) })
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    product.isActive = false
    await product.save()
    await product.populate([{ path: 'category', select: 'name slug isActive' }, { path: 'shop', select: 'name slug status isOfficial' }])
    res.status(200).json({ message: 'Product deactivated', product })
  } catch (err) {
    next(err)
  }
}
