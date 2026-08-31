// One-time provisioning script — NOT part of the running API. Run it by
// hand whenever an environment (local, staging, prod) needs its first
// admin account: `npm run seed:admin` from server/.
//
// Reads credentials from server/.env (ADMIN_NAME/ADMIN_EMAIL/ADMIN_PASSWORD)
// rather than accepting them as CLI args or hardcoding them here — same
// reasoning as every other secret in this project: never in source control,
// never in shell history/process list either.
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env

async function seedAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before running this script.')
    process.exit(1)
  }
  if (ADMIN_PASSWORD.length < 8) {
    // Same minimum authValidators.js enforces on regular signups — an
    // admin account is not the place to relax that.
    console.error('ADMIN_PASSWORD must be at least 8 characters.')
    process.exit(1)
  }

  await connectDB()
  const email = ADMIN_EMAIL.trim().toLowerCase()
  const existing = await User.findOne({ email })

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Already an admin, nothing to do: ${email}`)
    } else {
      // Promote in place. Deliberately does NOT touch passwordHash — this
      // account may already have a real password its owner knows; silently
      // overwriting it with ADMIN_PASSWORD would lock them out of their
      // own login.
      existing.role = 'admin'
      existing.isVerified = true
      await existing.save()
      console.log(`Promoted existing user to admin: ${email}`)
    }
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
    await User.create({
      name: ADMIN_NAME || 'Admin',
      email,
      passwordHash,
      role: 'admin',
      // No OTP step for a seeded admin — there's no inbox on the other end
      // to receive one; the account is trusted by construction here.
      isVerified: true,
    })
    console.log(`Admin created: ${email}`)
  }

  await mongoose.disconnect()
  process.exit(0)
}

seedAdmin().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
