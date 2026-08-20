import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Wraps guest-only routes (/login, /register) so an already-logged-in
// user gets redirected to their account instead of seeing the form again.
export default function PublicRoute() {
  const { user, initializing } = useAuth()

  if (initializing) return null
  if (user) return <Navigate to="/account" replace />

  return <Outlet />
}
