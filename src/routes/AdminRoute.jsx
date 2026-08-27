import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../context/AuthContext'

// Wraps admin-only routes (e.g. /admin/categories). Same shape as
// ProtectedRoute, plus a role check. This is a UX nicety only, same as
// ProtectedRoute is — the real boundary is protect + requireAdmin on the
// backend; a customer who somehow renders this page still can't get a
// server request past those.
export default function AdminRoute() {
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

  if (user.role !== 'admin') {
    return <Navigate to="/account" replace />
  }

  return <Outlet />
}
