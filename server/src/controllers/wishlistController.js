import Wishlist, { MAX_WISHLIST_ITEMS } from '../models/Wishlist.js'
import Product from '../models/Product.js'
import { customerVisibleFilter } from '../utils/customerVisibleFilter.js'

// Same "find it, or create it if missing" in ONE step (upsert) as the cart.
async function getOrCreateWishlist(userId) {
  return Wishlist.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { upsert: true, new: true },
  )
}

// The ids the frontend needs to colour the hearts. Strings, so the
// browser can compare them with product._id directly.
function idsOf(wishlist) {
  return wishlist.products.map((id) => id.toString())
}

// GET /api/wishlist
// `products`: the saved products a customer can still see, newest saved
// first, in the same shape as the shop listing (so ProductCard can show them).
// `productIds`: every saved id, used for the hearts and the header count.
export async function getWishlist(req, res, next) {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id)
    const ids = idsOf(wishlist)

    // Hidden products (or products in a hidden category) are left out,
    // but stay saved — they show up again if the admin brings them back.
    const products = await Product.find({ _id: { $in: wishlist.products }, ...(await customerVisibleFilter()) })
      .populate('category', 'name slug')

    // find() returns them in any order; put them back in saved order, newest first.
    const savedOrder = new Map(ids.map((id, index) => [id, index]))
    products.sort((a, b) => savedOrder.get(b._id.toString()) - savedOrder.get(a._id.toString()))

    res.status(200).json({ products, productIds: ids })
  } catch (err) {
    next(err)
  }
}

// POST /api/wishlist/:productId — save a product (saving it twice is harmless).
export async function addToWishlist(req, res, next) {
  try {
    const { productId } = req.params

    // Only products a customer could actually see in the shop can be saved.
    const product = await Product.findOne({ _id: productId, ...(await customerVisibleFilter()) })
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    const wishlist = await getOrCreateWishlist(req.user._id)
    const alreadySaved = wishlist.products.some((id) => id.equals(product._id))
    if (!alreadySaved && wishlist.products.length >= MAX_WISHLIST_ITEMS) {
      return res.status(400).json({ message: `Your wishlist is full (${MAX_WISHLIST_ITEMS} products). Remove some first.` })
    }

    // $addToSet = "add it, unless it's already in the list" — so a double
    // click can never save the same product twice.
    const updated = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { products: product._id } },
      { new: true },
    )
    res.status(200).json({ productIds: idsOf(updated) })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/wishlist/:productId — remove a product (removing one that
// isn't there is harmless too).
export async function removeFromWishlist(req, res, next) {
  try {
    // $pull = "take this value out of the list".
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { products: req.params.productId } },
      { new: true, upsert: true },
    )
    res.status(200).json({ productIds: idsOf(wishlist) })
  } catch (err) {
    next(err)
  }
}

// ---------------------------------------------------------------------------
// Guest wishlists, the same idea as guest carts: a visitor who isn't signed
// in keeps the saved product ids in the browser.
//   • preview — returns those products, in the shop-listing shape
//   • merge   — after sign-in, adds the ids to the account wishlist
// ---------------------------------------------------------------------------

// Visible products for a list of ids, newest-saved first (the browser keeps
// the list oldest first, like the database does).
async function visibleProductsInSavedOrder(ids) {
  const products = await Product.find({ _id: { $in: ids }, ...(await customerVisibleFilter()) }).populate(
    'category',
    'name slug',
  )
  const savedOrder = new Map(ids.map((id, index) => [id.toString(), index]))
  return products.sort((a, b) => savedOrder.get(b._id.toString()) - savedOrder.get(a._id.toString()))
}

// POST /api/wishlist/preview  { productIds }  — public.
export async function previewWishlist(req, res, next) {
  try {
    const ids = [...new Set(req.body.productIds)]
    res.status(200).json({ products: await visibleProductsInSavedOrder(ids), productIds: ids })
  } catch (err) {
    next(err)
  }
}

// POST /api/wishlist/merge  { productIds }  — signed in.
// Adds the guest's saved products to the account wishlist (only products a
// customer can see, no duplicates, never above MAX_WISHLIST_ITEMS).
export async function mergeWishlist(req, res, next) {
  try {
    const visible = await Product.find({
      _id: { $in: [...new Set(req.body.productIds)] },
      ...(await customerVisibleFilter()),
    }).distinct('_id')

    const wishlist = await getOrCreateWishlist(req.user._id)
    for (const id of visible) {
      if (wishlist.products.length >= MAX_WISHLIST_ITEMS) break
      if (!wishlist.products.some((saved) => saved.equals(id))) wishlist.products.push(id)
    }
    await wishlist.save()

    res.status(200).json({ productIds: idsOf(wishlist) })
  } catch (err) {
    next(err)
  }
}
