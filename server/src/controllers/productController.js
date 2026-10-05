import Product from '../models/Product.js'
import Category from '../models/Category.js'
import { customerVisibleFilter } from '../utils/customerVisibleFilter.js'

async function findActiveCategory(categoryId) {
  return Category.findOne({ _id: categoryId, isActive: true })
}

// The sort options the storefront may ask for (?sort=...). Anything else is
// rejected by listProductsRules, so a client can't sort by arbitrary fields.
export const PRODUCT_SORTS = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  name: { name: 1 },
}

// Typed text goes into a regular expression, so characters that mean
// something special there (like . * + ? ( ) are escaped to be matched
// literally — searching "c++" must not crash or match everything.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// GET /api/products?search=iphone&category=<id>&sort=price-asc
// All three are optional; with none, this returns every visible product.
export async function listActiveProducts(req, res, next) {
  try {
    const { search, category, sort } = req.query
    const filter = await customerVisibleFilter(category)

    if (search) {
      // 'i' = case-insensitive, so "iphone" finds "iPhone 16".
      const pattern = new RegExp(escapeRegex(search), 'i')
      filter.$or = [{ name: pattern }, { description: pattern }]
    }

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(PRODUCT_SORTS[sort] || PRODUCT_SORTS.newest)
    res.status(200).json({ products })
  } catch (err) {
    next(err)
  }
}

export async function listAllProducts(req, res, next) {
  try {
    const products = await Product.find({})
      .populate('category', 'name slug isActive')
      .sort({ createdAt: -1 })
    res.status(200).json({ products })
  } catch (err) {
    next(err)
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await Product.findOne({ _id: req.params.id, ...(await customerVisibleFilter()) }).populate(
      'category',
      'name slug',
    )
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
    const product = await Product.findById(req.params.id).populate('category', 'name slug isActive')
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

    const product = await Product.create(req.body)
    await product.populate('category', 'name slug')
    res.status(201).json({ message: 'Product created', product })
  } catch (err) {
    next(err)
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)
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
    await product.populate('category', 'name slug isActive')
    res.status(200).json({ message: 'Product updated', product })
  } catch (err) {
    next(err)
  }
}

export async function deactivateProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    product.isActive = false
    await product.save()
    await product.populate('category', 'name slug isActive')
    res.status(200).json({ message: 'Product deactivated', product })
  } catch (err) {
    next(err)
  }
}
