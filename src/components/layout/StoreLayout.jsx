import { Badge, Button } from 'antd'
import { ShoppingCartOutlined } from '@ant-design/icons'
import { Link, NavLink } from 'react-router-dom'
import Logo from '../Logo'
import UserMenu from './UserMenu'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

// Shell for every customer-facing page: sticky header, page content, footer.
export default function StoreLayout({ children }) {
  const { user, initializing } = useAuth()
  const { cart } = useCart()

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
              <NavLink
                to="/products"
                className={({ isActive }) => (isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-white')}
              >
                Shop
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Guests can click it too — /cart sends them to sign in first. */}
            <Link
              to="/cart"
              aria-label={`Cart, ${cart.itemCount} items`}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <Badge count={cart.itemCount} size="small" color="#6366f1">
                <ShoppingCartOutlined className="text-xl text-slate-300" />
              </Badge>
            </Link>

            {/* Render nothing until we know who the user is, so the header
                does not flicker from "Sign in" to the avatar on page load. */}
            {initializing ? null : user ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-2 text-sm font-medium text-slate-400 hover:text-white">
                  Sign in
                </Link>
                <Link to="/register">
                  <Button type="primary">Create account</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} ShopHub. All rights reserved.</span>
          <Link to="/products" className="hover:text-white">Shop all products</Link>
        </div>
      </footer>
    </div>
  )
}
