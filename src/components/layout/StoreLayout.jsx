import { Badge, Button } from 'antd'
import { HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { Link, NavLink } from 'react-router-dom'
import Logo from '../Logo'
import ThemeToggle from '../ThemeToggle'
import UserMenu from './UserMenu'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'

// Shell for every customer-facing page: sticky header, page content, footer.
// Active page: a soft pill behind the link; other links are plain text.
function navLinkClass({ isActive }) {
  return `rounded-full px-3 py-1.5 transition-colors ${isActive ? 'bg-coral/10 text-highlight' : 'text-subtle hover:text-highlight'}`
}

export default function StoreLayout({ children }) {
  const { user, initializing } = useAuth()
  const { cart } = useCart()
  const { count: wishlistCount } = useWishlist()

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
              <NavLink to="/products" className={navLinkClass}>
                Shop
              </NavLink>
              <NavLink to="/contact" className={navLinkClass}>
                Contact
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />

            <Link
              to="/wishlist"
              aria-label={`Wishlist, ${wishlistCount} saved`}
              className="flex h-9 w-9 items-center justify-center rounded-full text-soft hover:bg-coral/10 hover:text-highlight"
            >
              <Badge count={wishlistCount} size="small" color="var(--coral)">
                <HeartOutlined className="text-xl text-soft" />
              </Badge>
            </Link>

            {/* Guests can click it too — /cart sends them to sign in first. */}
            <Link
              to="/cart"
              aria-label={`Cart, ${cart.itemCount} items`}
              className="flex h-9 w-9 items-center justify-center rounded-full text-soft hover:bg-coral/10 hover:text-highlight"
            >
              <Badge count={cart.itemCount} size="small" color="var(--coral)">
                <ShoppingCartOutlined className="text-xl text-soft" />
              </Badge>
            </Link>

            {/* Render nothing until we know who the user is, so the header
                does not flicker from "Sign in" to the avatar on page load. */}
            {initializing ? null : user ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-2 text-sm font-medium text-subtle hover:text-ink">
                  Sign in
                </Link>
                {/* Hidden on phones: it doesn't fit next to the cart and Sign in,
                    and the sign-in page links to registration anyway. */}
                <Link to="/register" className="hidden sm:block">
                  <Button type="primary">Create account</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-subtle sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} ShopHub. All rights reserved.</span>
          <Link to="/products" className="hover:text-highlight">Shop all products</Link>
          {/* Guests are sent to sign in first, then come back here. */}
          {user?.role !== 'admin' && (
            <Link to="/open-shop" className="hover:text-highlight">
              {user?.role === 'seller' ? 'My shop' : 'Sell on ShopHub'}
            </Link>
          )}
          <Link to="/contact" className="hover:text-highlight">Contact us</Link>
        </div>
      </footer>
    </div>
  )
}
