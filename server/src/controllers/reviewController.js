import mongoose from 'mongoose'
import Review from '../models/Review.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import { customerVisibleFilter } from '../utils/customerVisibleFilter.js'

const MAX_REVIEWS_SHOWN = 50

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

// Reviews belong to products customers can see; a hidden product's reviews
// are hidden too.
async function findVisibleProduct(productId) {
  const product = await Product.findOne({ _id: productId, ...(await customerVisibleFilter()) })
  if (!product) throw fail(404, 'Product not found.')
  return product
}

// "Verified buyer" rule: only someone who actually RECEIVED this product
// (an order containing it that reached "delivered") may review it.
function hasReceivedProduct(userId, productId) {
  return Order.exists({ user: userId, status: 'delivered', 'items.product': productId })
}

// Recalculates the product's average rating and review count from its
// reviews (MongoDB does the maths) and stores them on the product. Called
// after every add / change / delete, so the shop never shows stale stars.
async function updateProductRating(productId) {
  const [result] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  await Product.updateOne(
    { _id: productId },
    {
      // Rounded to one decimal place: 4.333… → 4.3
      ratingAverage: result ? Math.round(result.average * 10) / 10 : 0,
      ratingCount: result ? result.count : 0,
    },
  )
}

// GET /api/products/:productId/reviews — public. The newest reviews plus a
// summary: average, count, and how many reviews gave each star (5 → 1).
export async function listReviews(req, res, next) {
  try {
    const product = await findVisibleProduct(req.params.productId)

    const [reviews, starGroups] = await Promise.all([
      Review.find({ product: product._id })
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(MAX_REVIEWS_SHOWN),
      Review.aggregate([{ $match: { product: product._id } }, { $group: { _id: '$rating', count: { $sum: 1 } } }]),
    ])

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    for (const group of starGroups) breakdown[group._id] = group.count

    res.status(200).json({
      reviews: reviews.map((review) => ({
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        // Only the reviewer's name is public — never their email or id.
        author: review.user?.name || 'Former customer',
      })),
      summary: { average: product.ratingAverage, count: product.ratingCount, breakdown },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/products/:productId/reviews/me — can the signed-in user review
// this product, and have they already? Lets the page show the right form.
export async function getMyReviewStatus(req, res, next) {
  try {
    const product = await findVisibleProduct(req.params.productId)
    const [received, myReview] = await Promise.all([
      hasReceivedProduct(req.user._id, product._id),
      Review.findOne({ product: product._id, user: req.user._id }),
    ])
    res.status(200).json({
      canReview: Boolean(received),
      myReview: myReview ? { _id: myReview._id, rating: myReview.rating, comment: myReview.comment } : null,
    })
  } catch (err) {
    next(err)
  }
}

// PUT /api/products/:productId/reviews  { rating, comment? } — writes the
// signed-in user's review, or updates it if they already wrote one.
export async function saveMyReview(req, res, next) {
  try {
    const product = await findVisibleProduct(req.params.productId)

    if (!(await hasReceivedProduct(req.user._id, product._id))) {
      throw fail(403, 'You can review this product once your order with it has been delivered.')
    }

    const { rating, comment = '' } = req.body
    // Find-or-create in ONE step (upsert): the first time creates the
    // review, later times update it. The unique index guarantees one each.
    const review = await Review.findOneAndUpdate(
      { product: product._id, user: req.user._id },
      { rating, comment },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    )

    await updateProductRating(product._id)
    res.status(200).json({ message: 'Review saved', review: { _id: review._id, rating: review.rating, comment: review.comment } })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/products/:productId/reviews — removes the signed-in user's own review.
export async function deleteMyReview(req, res, next) {
  try {
    const deleted = await Review.findOneAndDelete({ product: req.params.productId, user: req.user._id })
    if (!deleted) throw fail(404, 'You have not reviewed this product.')
    await updateProductRating(req.params.productId)
    res.status(200).json({ message: 'Review deleted' })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/products/:productId/reviews/:reviewId — admin removes any
// review (spam, rude language...).
export async function adminDeleteReview(req, res, next) {
  try {
    const deleted = await Review.findOneAndDelete({ _id: req.params.reviewId, product: req.params.productId })
    if (!deleted) throw fail(404, 'Review not found.')
    await updateProductRating(req.params.productId)
    res.status(200).json({ message: 'Review deleted' })
  } catch (err) {
    next(err)
  }
}
