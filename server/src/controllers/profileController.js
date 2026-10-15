import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { sanitizeUser } from '../utils/sanitizeUser.js'
import { issueSession } from './authController.js'

// Every action here works on req.user — the account from the token — so a
// user can only ever change their OWN profile. No route takes a user id.

// PATCH /api/profile  { name }
export async function updateProfile(req, res, next) {
  try {
    req.user.name = req.body.name
    await req.user.save()
    res.status(200).json({ message: 'Profile updated', user: sanitizeUser(req.user) })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/profile/password  { currentPassword, newPassword }
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body

    // passwordHash is select:false, so it has to be asked for explicitly.
    const user = await User.findById(req.user._id).select('+passwordHash')

    // Proving you know the current password stops someone who finds your
    // laptop already signed in from locking you out of your own account.
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isMatch) {
      return res.status(400).json({ message: 'Your current password is incorrect.' })
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10)

    // A new session replaces the stored refresh token, which signs out every
    // OTHER device still using the old password. This device stays signed in
    // with the new access token returned below.
    const accessToken = await issueSession(res, user)

    res.status(200).json({ message: 'Password changed', accessToken })
  } catch (err) {
    next(err)
  }
}

// PUT /api/profile/address  { fullName, phone, addressLine, city, postalCode? }
export async function saveAddress(req, res, next) {
  try {
    const { fullName, phone, addressLine, city, postalCode = '' } = req.body
    req.user.savedAddress = { fullName, phone, addressLine, city, postalCode }
    await req.user.save()
    res.status(200).json({ message: 'Address saved', user: sanitizeUser(req.user) })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/profile/address
export async function removeAddress(req, res, next) {
  try {
    req.user.savedAddress = undefined
    await req.user.save()
    res.status(200).json({ message: 'Address removed', user: sanitizeUser(req.user) })
  } catch (err) {
    next(err)
  }
}
