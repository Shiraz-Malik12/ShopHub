// Demo-catalog script — NOT part of the running API. Run it by hand from
// server/ when you want a fresh, realistic product catalog:
//
//   npm run seed:products            → only shows what WOULD happen
//   npm run seed:products -- --yes   → actually does it
//
// It REPLACES the whole catalog: every existing product is deleted and the
// demo products below are created. Past orders are left alone — they keep
// their own copy (snapshot) of each product — and any image a past order
// still shows is kept on disk; all other images of deleted products are
// removed.
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import Cart from '../models/Cart.js'
import Order from '../models/Order.js'
import { slugify } from '../utils/slugify.js'
import { deleteImage, EXTERNAL_PREFIX } from '../utils/cloudinaryUpload.js'

// `aliases`: older names this category may already exist under (e.g. a
// typo), so it is renamed instead of duplicated.
const CATEGORIES = [
  { name: 'Electronics', aliases: ['Electronices'] },
  { name: 'Charger', aliases: ['Chargers'] },
  { name: 'Books', aliases: [] },
]

// Stock levels are mixed on purpose so every badge shows up in the store:
// plenty ("In Stock"), 1–5 ("Only N left!") and 0 ("Out of Stock").
// `photo`: the id of a matching free photo on Unsplash (see unsplashImage).
const PRODUCTS = [
  { category: 'Electronics', name: 'Wireless Bluetooth Headphones', photo: 'photo-1505740420928-5e560c06d30e', price: 79.99, stock: 25, description: 'Over-ear headphones with active noise cancelling, 30-hour battery life and a foldable design for travel.' },
  { category: 'Electronics', name: 'Smart Watch Series 5', photo: 'photo-1579586337278-3befd40fd17a', price: 149, stock: 12, description: 'Tracks steps, heart rate and sleep. Water resistant, with notifications from your phone right on your wrist.' },
  { category: 'Electronics', name: 'Portable Bluetooth Speaker', photo: 'photo-1608043152269-423dbba4e7e1', price: 45.5, stock: 30, description: 'Compact speaker with deep bass, 12 hours of playtime and a splash-proof body for outdoor use.' },
  { category: 'Electronics', name: '4K Action Camera', photo: 'photo-1562878671-b3efe27953b9', price: 129, stock: 4, description: 'Records smooth 4K video with image stabilisation. Comes with a waterproof case and helmet mount.' },
  { category: 'Charger', name: '20W USB-C Fast Charger', photo: 'photo-1586254116951-5263e2cdb44c', price: 19.99, stock: 50, description: 'Charges a phone to 50% in about 30 minutes. Small enough to carry in any bag.' },
  { category: 'Charger', name: '65W GaN Laptop Charger', photo: 'photo-1756043827116-5764e6d23d85', price: 39.99, stock: 8, description: 'One charger for laptop, tablet and phone. Two USB-C ports and one USB-A port.' },
  { category: 'Charger', name: 'Wireless Charging Pad', photo: 'photo-1591290619618-904f6dd935e3', price: 24.99, stock: 0, description: 'Place your phone on the pad to charge — no cable needed. Works with most modern phones.' },
  { category: 'Charger', name: '10,000mAh Power Bank', photo: 'photo-1566554738544-d962991c3fee', price: 29.99, stock: 15, description: 'Charge your phone up to three times on the go. Includes a USB-C cable.' },
  { category: 'Books', name: 'Clean Code', photo: 'photo-1484665739383-a1069a82d4be', price: 34.5, stock: 10, description: 'A handbook of good programming habits: how to write code that is easy to read, change and test.' },
  { category: 'Books', name: 'The Pragmatic Programmer', photo: 'photo-1672309558498-cfcc89afff25', price: 42, stock: 6, description: 'Practical advice for growing as a software developer, from small daily habits to big career choices.' },
  { category: 'Books', name: 'Atomic Habits', photo: 'photo-1541963463532-d68292c34b19', price: 18.99, stock: 3, description: 'How tiny changes, repeated every day, add up to remarkable results.' },
  { category: 'Books', name: 'JavaScript: The Good Parts', photo: 'photo-1607799279861-4dd421887fb3', price: 22, stock: 9, description: 'A short guide to the most useful and reliable parts of JavaScript.' },
]

// A free photo from Unsplash (unsplash.com, free to use under the Unsplash
// License), linked directly rather than uploaded. The publicId is marked
// external so deleting or replacing it from the admin page doesn't try to
// delete a file we don't own. Real product photos can replace these any
// time from the admin Products page (Edit → Images).
function unsplashImage(photoId) {
  return [
    {
      url: `https://images.unsplash.com/${photoId}?w=800&h=800&fit=crop&auto=format&q=80`,
      publicId: `${EXTERNAL_PREFIX}unsplash:${photoId}`,
    },
  ]
}

async function findOrCreateCategory({ name, aliases }) {
  const slug = slugify(name)
  const candidates = [slug, ...aliases.map(slugify)]
  const existing = await Category.findOne({ slug: { $in: candidates } })
  if (existing) {
    const renamed = existing.name !== name
    existing.name = name
    existing.slug = slug
    existing.isActive = true
    await existing.save()
    console.log(renamed ? `  renamed category  ${existing.name} (was a typo/alias)` : `  kept category     ${name}`)
    return existing
  }
  console.log(`  created category  ${name}`)
  return Category.create({ name, slug })
}

async function seedProducts() {
  const confirmed = process.argv.includes('--yes')
  await connectDB()

  const existingProducts = await Product.find({})
  console.log(`\nThis will DELETE ${existingProducts.length} existing product(s):`)
  for (const product of existingProducts) console.log(`  - ${product.name}`)
  console.log(`and create ${PRODUCTS.length} demo products in ${CATEGORIES.length} categories.`)

  if (!confirmed) {
    console.log('\nNothing was changed. Run again with --yes to do it:  npm run seed:products -- --yes')
    await mongoose.disconnect()
    return
  }

  // 1. Remove the old products, and take them out of any cart.
  const oldIds = existingProducts.map((product) => product._id)
  await Product.deleteMany({ _id: { $in: oldIds } })
  await Cart.updateMany({}, { $pull: { items: { product: { $in: oldIds } } } })
  console.log(`\nDeleted ${oldIds.length} product(s).`)

  // 2. Delete their image files — except ones a past order still shows.
  const orders = await Order.find({}, { 'items.image': 1 })
  const imagesUsedByOrders = new Set(orders.flatMap((order) => order.items.map((item) => item.image)))
  let deletedImages = 0
  let keptImages = 0
  for (const product of existingProducts) {
    for (const image of product.images) {
      // Linked from another site (or an old placeholder): no file of ours to delete.
      if (image.publicId.startsWith(EXTERNAL_PREFIX) || image.publicId.startsWith('placeholder:')) continue
      if (imagesUsedByOrders.has(image.url)) {
        keptImages += 1
      } else {
        await deleteImage(image.publicId)
        deletedImages += 1
      }
    }
  }
  console.log(`Deleted ${deletedImages} image file(s); kept ${keptImages} still shown in past orders.`)

  // 3. Make sure the categories exist (fixing old names), then add products.
  console.log('\nCategories:')
  const categoryByName = {}
  for (const category of CATEGORIES) {
    categoryByName[category.name] = await findOrCreateCategory(category)
  }

  const created = await Product.create(
    PRODUCTS.map((product) => ({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: categoryByName[product.category]._id,
      images: unsplashImage(product.photo),
    })),
  )

  console.log(`\nCreated ${created.length} products:`)
  for (const category of CATEGORIES) {
    const names = PRODUCTS.filter((product) => product.category === category.name).map((product) => product.name)
    console.log(`  ${category.name} (${names.length}): ${names.join(', ')}`)
  }

  await mongoose.disconnect()
}

seedProducts().catch(async (err) => {
  console.error('Seeding products failed:', err)
  await mongoose.disconnect()
  process.exit(1)
})
