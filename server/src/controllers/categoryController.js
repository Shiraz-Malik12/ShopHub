import Category from '../models/Category.js'
import { slugify } from '../utils/slugify.js'

// A real Mongo ObjectId is always exactly 24 hex characters. Used to tell
// apart the two things :idOrSlug could be, without a DB round trip.
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/

// GET /api/categories — public/customer-facing. Only ever returns active
// categories; there is no way for a client to ask this route for inactive
// ones (compare listAllCategories, which is admin-only).
export async function listActiveCategories(req, res, next) {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 })
    res.status(200).json({ categories })
  } catch (err) {
    next(err)
  }
}

// GET /api/categories/admin — admin-only. Sees everything, active and
// deactivated, so the admin table can offer a "reactivate" action.
export async function listAllCategories(req, res, next) {
  try {
    const categories = await Category.find({}).sort({ name: 1 })
    res.status(200).json({ categories })
  } catch (err) {
    next(err)
  }
}

// GET /api/categories/:idOrSlug — public. Accepts either a Mongo _id (so an
// admin edit link can reuse it) or a slug (so a future customer-facing
// category page can). Always filtered to isActive: true — from outside, an
// inactive category must look identical to one that doesn't exist, or the
// endpoint would leak which categories are hidden.
export async function getCategory(req, res, next) {
  try {
    const { idOrSlug } = req.params
    const query = OBJECT_ID_RE.test(idOrSlug)
      ? { _id: idOrSlug, isActive: true }
      : { slug: idOrSlug, isActive: true }

    const category = await Category.findOne(query)
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' })
    }
    res.status(200).json({ category })
  } catch (err) {
    next(err)
  }
}

// POST /api/categories — admin only. `slug` and `isActive` are never read
// from the request body: the slug is always derived from `name`, and a new
// category always starts active (schema default) regardless of what the
// client sends.
export async function createCategory(req, res, next) {
  try {
    const { name } = req.body
    const category = await Category.create({ name, slug: slugify(name) })
    res.status(201).json({ message: 'Category created', category })
  } catch (err) {
    if (err.code === 11000) {
      // Unique index on slug rejected it — same name (or a same-slug
      // near-duplicate) already exists.
      return res.status(409).json({ message: 'A category with this name already exists.' })
    }
    next(err)
  }
}

// PATCH /api/categories/:id — admin only. Also how a deactivated category
// gets reactivated (isActive: true in the body) — no separate endpoint for
// that. Both fields are optional; only what's provided gets changed.
export async function updateCategory(req, res, next) {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' })
    }

    if (req.body.name !== undefined) {
      category.name = req.body.name
      category.slug = slugify(req.body.name) // re-derived, never taken from the client
    }
    if (req.body.isActive !== undefined) {
      category.isActive = req.body.isActive
    }

    await category.save()
    res.status(200).json({ message: 'Category updated', category })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A category with this name already exists.' })
    }
    next(err)
  }
}

// DELETE /api/categories/:id — admin only. Soft delete: flips isActive to
// false instead of removing the document, so products that reference this
// category later (Feature 2) never end up pointing at nothing. Calling it
// again on an already-inactive category is a harmless no-op, not an error.
export async function deactivateCategory(req, res, next) {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' })
    }

    category.isActive = false
    await category.save()
    res.status(200).json({ message: 'Category deactivated', category })
  } catch (err) {
    next(err)
  }
}
