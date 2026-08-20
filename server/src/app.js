import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import authRoutes from './routes/authRoutes.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

const app = express()

// credentials: true is required for the browser to send/receive the
// httpOnly refresh-token cookie (matches axios's withCredentials: true).
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
