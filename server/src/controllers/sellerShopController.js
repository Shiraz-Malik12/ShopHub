import { deleteImage, uploadImageBuffer } from '../utils/cloudinaryUpload.js'

// The seller's own shop profile, for the seller panel's "Shop profile"
// page. requireSeller has already loaded the APPROVED shop into req.shop,
// so nothing here can reach another seller's shop.

// What may be edited after approval. The name is not here on purpose: it
// makes the shop's web address (/shops/<slug>), and changing it would break
// every link customers saved. A rename goes through the admin.
const EDITABLE_FIELDS = ['description', 'phone', 'city']

function toSellerShop(shop) {
  return {
    id: shop._id,
    name: shop.name,
    slug: shop.slug,
    description: shop.description,
    phone: shop.phone,
    city: shop.city,
    status: shop.status,
    logo: shop.logo?.url || null,
    isOfficial: shop.isOfficial,
  }
}

// GET /api/seller/shop
export function getSellerShop(req, res) {
  res.status(200).json({ shop: toSellerShop(req.shop) })
}

// PATCH /api/seller/shop  { description?, phone?, city? }
export async function updateSellerShop(req, res, next) {
  try {
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) req.shop[field] = req.body[field]
    }
    await req.shop.save()
    res.status(200).json({ message: 'Shop profile saved', shop: toSellerShop(req.shop) })
  } catch (err) {
    next(err)
  }
}

// PUT /api/seller/shop/logo  (multipart, one file in the "image" field)
// Uploads the new logo first, saves it, and only then deletes the old file,
// so a failed upload never leaves the shop without its old logo.
export async function setShopLogo(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please choose an image.' })

    const oldPublicId = req.shop.logo?.publicId
    const uploaded = await uploadImageBuffer(req.file, 'shops')
    try {
      req.shop.logo = uploaded
      await req.shop.save()
    } catch (err) {
      await deleteImage(uploaded.publicId) // don't leave an unused file behind
      throw err
    }
    if (oldPublicId) await deleteImage(oldPublicId)

    res.status(200).json({ message: 'Logo updated', shop: toSellerShop(req.shop) })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/seller/shop/logo
export async function removeShopLogo(req, res, next) {
  try {
    const oldPublicId = req.shop.logo?.publicId
    req.shop.logo = undefined
    await req.shop.save()
    if (oldPublicId) await deleteImage(oldPublicId)
    res.status(200).json({ message: 'Logo removed', shop: toSellerShop(req.shop) })
  } catch (err) {
    next(err)
  }
}
