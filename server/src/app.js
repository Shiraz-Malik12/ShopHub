import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import authRoutes from './routes/authRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import wishlistRoutes from './routes/wishlistRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import couponRoutes from './routes/couponRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import customerRoutes from './routes/customerRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import { LOCAL_UPLOADS_DIR } from './utils/cloudinaryUpload.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

const isProduction = process.env.NODE_ENV === 'production'

// The built React app (`npm run build` in the project root writes it here).
const CLIENT_DIST_DIR = path.resolve(import.meta.dirname, '../../dist')

const app = express()

// Hosts like Render/Railway put a proxy in front of the server, so every
// request seems to come from the proxy's address. TRUST_PROXY=1 tells
// Express to read the visitor's real address from the proxy instead —
// without it, the login rate limits would count ALL visitors as one person.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY)
}

// Security headers (HSTS, no clickjacking, no MIME sniffing...). The
// Content-Security-Policy lists exactly where the website may load things
// from; anything else (e.g. a script injected by an attacker) is blocked.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // 'unsafe-inline': Ant Design adds its styles at runtime.
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        // Product photos: Cloudinary uploads + the Unsplash demo photos.
        imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://images.unsplash.com'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        // Only force https:// for page resources when the shop itself is on https.
        upgradeInsecureRequests: process.env.CLIENT_URL?.startsWith('https://') ? [] : null,
      },
    },
  }),
)

// credentials: true is required for the browser to send/receive the
// httpOnly refresh-token cookie (matches axios's withCredentials: true).
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())
if (process.env.NODE_ENV !== 'test') {
  // 'combined' = the standard detailed log format hosting dashboards expect.
  app.use(morgan(isProduction ? 'combined' : 'dev'))
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products/:productId/reviews', reviewRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/admin/customers', customerRoutes)
app.use('/api/admin', dashboardRoutes)
app.use('/api/profile', profileRoutes)

// Serves images saved by the dev fallback in utils/cloudinaryUpload.js (only
// used while Cloudinary keys are missing). Under /api so the Vite dev proxy
// forwards these requests to Express as well.
app.use('/api/uploads', express.static(LOCAL_UPLOADS_DIR))

// In production this one server also serves the website itself, so the
// shop and its API live on the same address (no CORS, cookies just work).
if (isProduction && fs.existsSync(path.join(CLIENT_DIST_DIR, 'index.html'))) {
  app.use(
    express.static(CLIENT_DIST_DIR, {
      setHeaders(res, filePath) {
        // Files in /assets have a content hash in their name (index-a1b2c3.js),
        // so browsers may keep them for a year. index.html must always be
        // fresh, or visitors would keep loading an old version of the shop.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        } else {
          res.setHeader('Cache-Control', 'no-cache')
        }
      },
    }),
  )
  // Every non-API address (/products, /cart, /orders/123...) gets the React
  // app, which then shows the right page. Unknown /api/... still gets a 404.
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(path.join(CLIENT_DIST_DIR, 'index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)

export default app
