import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePathFor } from '../utils/homePathFor'
import BrandMark from '../components/BrandMark'

// Wraps guest-only routes (/login, /register) so an already-logged-in
// user goes to their home page (shop or admin) instead of seeing the form again.
export default function PublicRoute() {
  const { user, initializing } = useAuth()
  const location = useLocation()

  // While we check for an existing session (can take a few seconds when the
  // server is waking up), show the logo gently pulsing — not a blank screen.
  if (initializing) {
    return (
      <div className="min-h-visible flex items-center justify-center bg-page" role="status" aria-label="Loading">
        <BrandMark size={56} className="animate-pulse" />
      </div>
    )
  }
  // Right after logging in, this runs BEFORE LoginPage's own navigate(from)
  // (React Router makes that one a low-priority "transition"), so it must
  // honour `from` too — otherwise /checkout or /open-shop → login would
  // always end up on the home page instead of going back.
  if (user) return <Navigate to={location.state?.from?.pathname || homePathFor(user)} replace />

  return <Outlet />
}
