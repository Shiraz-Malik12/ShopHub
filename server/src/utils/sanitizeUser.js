// Shapes exactly what the frontend is allowed to see about a user.
// Never spread `user` directly into a response — passwordHash/otp/
// refreshTokenHash are select:false in the schema for defense-in-depth,
// but this function is the actual, explicit allowlist.
export function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  }
}
