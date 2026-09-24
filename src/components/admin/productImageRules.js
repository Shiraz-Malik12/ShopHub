// Mirrors the backend limits in server/src/middleware/uploadImages.js and
// server/src/models/Product.js. These checks are only for fast feedback —
// the server re-checks everything.
export const MAX_IMAGES = 5
export const MAX_FILE_SIZE_MB = 5
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Returns an error message for the first bad file, or null if all are fine.
export function validateImageFiles(files) {
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) return `${file.name}: only JPG, PNG or WebP images are allowed.`
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `${file.name}: each image must be ${MAX_FILE_SIZE_MB} MB or smaller.`
  }
  return null
}
