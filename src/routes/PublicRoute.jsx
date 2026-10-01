import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePathFor } from '../utils/homePathFor'

// Wraps guest-only routes (/login, /register) so an already-logged-in
// user goes to their home page (shop or admin) instead of seeing the form again.
export default function PublicRoute() {
  const { user, initializing } = useAuth()

  if (initializing) return null
  if (user) return <Navigate to={homePathFor(user)} replace />

  return <Outlet />
}
