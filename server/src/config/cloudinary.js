import { v2 as cloudinary } from 'cloudinary'

// Configured lazily (on first use) instead of at import time: ES module
// imports run before server.js's `dotenv/config` has filled process.env
// in some import orders, so reading the keys here at the top level could
// see them as undefined.
let configured = false

export function isCloudinaryConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
}

export function getCloudinary() {
  if (!configured) {
    if (!isCloudinaryConfigured()) {
      const error = new Error('Image storage is not configured on the server.')
      error.status = 503
      throw error
    }
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    })
    configured = true
  }
  return cloudinary
}
