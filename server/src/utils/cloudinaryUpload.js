import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js'

const PRODUCT_IMAGE_FOLDER = 'shophub/products'

// Dev fallback storage (see useLocalStorage below). Served by app.js at
// /api/uploads so the Vite dev proxy forwards image requests too.
export const LOCAL_UPLOADS_DIR = path.resolve(import.meta.dirname, '../../uploads')
const LOCAL_PREFIX = 'local:'
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

// Dev convenience, same idea as sendEmail.js's console fallback: until real
// Cloudinary keys are added to server/.env, save images to server/uploads
// instead of failing every upload. Never used in production — there a
// missing key is a real misconfiguration and getCloudinary() returns 503.
function useLocalStorage() {
  return !isCloudinaryConfigured() && process.env.NODE_ENV !== 'production'
}

// Multer only trusts the mimetype the browser *claims*. The first bytes of
// a file ("magic bytes") say what it really is, so a PDF renamed to .jpg is
// caught here before it's stored anywhere.
function looksLikeImage(buffer, mimetype) {
  if (mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (mimetype === 'image/png') return buffer.subarray(0, 4).toString('hex') === '89504e47'
  if (mimetype === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  }
  return false
}

async function saveLocally(buffer, mimetype) {
  const fileName = `${crypto.randomUUID()}.${EXTENSIONS[mimetype]}`
  await fs.mkdir(path.join(LOCAL_UPLOADS_DIR, 'products'), { recursive: true })
  await fs.writeFile(path.join(LOCAL_UPLOADS_DIR, 'products', fileName), buffer)
  console.warn(`[images:dev-fallback] Saved ${fileName} to server/uploads (Cloudinary not configured)`)
  return { url: `/api/uploads/products/${fileName}`, publicId: `${LOCAL_PREFIX}products/${fileName}` }
}

// Multer (memory storage) hands us the file as a Buffer, not a path on
// disk, so we stream the bytes to Cloudinary instead of using upload(path).
function uploadToCloudinary(buffer) {
  const cloudinary = getCloudinary()
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: PRODUCT_IMAGE_FOLDER, resource_type: 'image' },
      (error, result) => {
        if (error) {
          // Cloudinary answers 4xx when the bytes aren't a real image (e.g.
          // a renamed PDF) — that's the client's fault, so surface it as a
          // 400. Anything else means Cloudinary itself failed: 502.
          const clientError = error.http_code >= 400 && error.http_code < 500
          const wrapped = new Error(
            clientError ? 'The uploaded file is not a valid image.' : 'Image upload failed, please try again.',
          )
          wrapped.status = clientError ? 400 : 502
          wrapped.cause = error
          return reject(wrapped)
        }
        resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )
    stream.end(buffer)
  })
}

// Takes one Multer file ({ buffer, mimetype, ... }) and returns { url, publicId }.
export async function uploadImageBuffer(file) {
  if (!looksLikeImage(file.buffer, file.mimetype)) {
    const error = new Error('The uploaded file is not a valid image.')
    error.status = 400
    throw error
  }
  return useLocalStorage() ? saveLocally(file.buffer, file.mimetype) : uploadToCloudinary(file.buffer)
}

// Cleanup only — never throws. Called *after* the database is already
// correct, so a failed delete just leaves an unused file behind (harmless)
// rather than breaking the request.
export async function deleteImage(publicId) {
  try {
    if (publicId.startsWith(LOCAL_PREFIX)) {
      const relativePath = path.normalize(publicId.slice(LOCAL_PREFIX.length))
      await fs.unlink(path.join(LOCAL_UPLOADS_DIR, relativePath))
    } else {
      await getCloudinary().uploader.destroy(publicId)
    }
  } catch (err) {
    console.error(`[images] Failed to delete ${publicId}:`, err.message)
  }
}

export async function deleteImages(publicIds) {
  await Promise.all(publicIds.map(deleteImage))
}
