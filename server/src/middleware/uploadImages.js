import multer from 'multer'
import { MAX_PRODUCT_IMAGES } from '../models/Product.js'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_MB = 5

// memoryStorage: the file stays in RAM as req.file(s).buffer only for the
// life of this request, then goes straight to Cloudinary. Nothing is ever
// written to the server's disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: MAX_PRODUCT_IMAGES },
  fileFilter(req, file, cb) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      const error = new Error('Only JPG, PNG or WebP images are allowed.')
      error.status = 400
      return cb(error)
    }
    cb(null, true)
  },
})

// Multer's own errors (too large, too many files, wrong field name) don't
// carry a status, so the global errorHandler would treat them as 500s.
// Translate them into clear 400s here, right where they happen.
const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: `Each image must be ${MAX_FILE_SIZE_MB} MB or smaller.`,
  LIMIT_FILE_COUNT: `A product can have at most ${MAX_PRODUCT_IMAGES} images.`,
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field. Please upload images using the correct field.',
}

function withMulterErrors(middleware) {
  return function (req, res, next) {
    middleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        err.status = 400
        err.message = MULTER_MESSAGES[err.code] || err.message
      }
      next(err)
    })
  }
}

export const uploadProductImages = withMulterErrors(upload.array('images', MAX_PRODUCT_IMAGES))
export const uploadSingleProductImage = withMulterErrors(upload.single('image'))
