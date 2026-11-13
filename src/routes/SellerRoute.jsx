import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../context/AuthContext'

// Wraps seller-only routes (/seller/...). Same idea as AdminRoute: a UX
// nicety only. The real check is requireSeller on the backend, which also
// turns away a seller whose shop was suspended a moment ago.
export default function SellerRoute() {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Not (or no longer) a seller: the shop page explains where they stand.
  if (user.role !== 'seller') {
    return <Navigate to="/open-shop" replace />
  }

  return <Outlet />
}
