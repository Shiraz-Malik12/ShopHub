// Authorization (role check) — separate from protect.js, which only
// establishes *authentication* (who is this?). This answers *permission*
// (is this specific user allowed to do this specific thing?), so it must
// always run after protect, since it reads req.user that protect sets.
export function authorize(...allowedRoles) {
  return function (req, res, next) {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' })
    }
    next()
  }
}

export const requireAdmin = authorize('admin')
