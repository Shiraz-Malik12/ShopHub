import Product from '../models/Product.js'
import Category from '../models/Category.js'

async function findActiveCategory(categoryId) {
  return Category.findOne({ _id: categoryId, isActive: true })
}

// What a customer is allowed to see: the product must be active AND sit in
// an active category. Hiding a category should hide its products too — the
// backend enforces this, not the storefront, so no client can bypass it.
async function customerVisibleFilter() {
  const activeCategoryIds = await Category.find({ isActive: true }).distinct('_id')
  return { isActive: true, category: { $in: activeCategoryIds } }
}

export async function listActiveProducts(req, res, next) {
  try {
    const products = await Product.find(await customerVisibleFilter())
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
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
