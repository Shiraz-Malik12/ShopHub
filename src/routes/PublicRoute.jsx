import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePathFor } from '../utils/homePathFor'
import BrandMark from '../components/BrandMark'

// Wraps guest-only routes (/login, /register) so an already-logged-in
// user goes to their home page (shop or admin) instead of seeing the form again.
export default function PublicRoute() {
  const { user, initializing } = useAuth()

  // While we check for an existing session (can take a few seconds when the
  // server is waking up), show the logo gently pulsing — not a blank screen.
  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page" role="status" aria-label="Loading">
        <BrandMark size={56} className="animate-pulse" />
      </div>
    )
  }
  if (user) return <Navigate to={homePathFor(user)} replace />

  return <Outlet />
}
