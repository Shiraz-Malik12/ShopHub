import 'dotenv/config'
import { validateEnvOrExit } from './config/env.js'
import { connectDB } from './config/db.js'

// Check the settings first — before anything else is loaded or connected.
validateEnvOrExit()

const { default: app } = await import('./app.js')

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`ShopHub API running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`))
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message)
    process.exit(1)
  })
