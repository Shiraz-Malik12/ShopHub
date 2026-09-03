import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Dropdown } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'

// Only ever mounted inside protected pages (DashboardPage), so `user` is
// always present here — no guest branch needed. If a public page is added
// later (e.g. a real storefront home), reintroduce a Sign in/Sign up state.
export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const menuItems = [
    { key: 'products', label: <Link to="/products">Products</Link> },
    ...(user
      ? [
          { key: 'account', label: <Link to="/account">My account</Link> },
          ...(user.role === 'admin'
            ? [
                { key: 'categories', label: <Link to="/admin/categories">Manage categories</Link> },
                { key: 'admin-products', label: <Link to="/admin/products">Manage products</Link> },
              ]
            : []),
          { key: 'logout', label: 'Sign out', onClick: handleLogout },
        ]
      : [{ key: 'login', label: <Link to="/login">Sign in</Link> }]),
  ]

  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/account" className="text-xl font-bold text-indigo-400">
          ShopHub
        </Link>

        <Dropdown menu={{ items: menuItems }}
        >
          <button className="flex items-center gap-2 text-sm font-medium text-slate-200">
            {user ? <Avatar size="small" icon={<UserOutlined />} /> : null}
            {user?.name || 'Menu'}
          </button>
        </Dropdown>
      </div>
    </header>
  )
}
