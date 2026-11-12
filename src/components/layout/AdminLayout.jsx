import { AppstoreOutlined, DashboardOutlined, ExportOutlined, MailOutlined, PercentageOutlined, ShoppingOutlined, TagsOutlined, TeamOutlined } from '@ant-design/icons'
import { Link, NavLink } from 'react-router-dom'
import Logo from '../Logo'
import ThemeToggle from '../ThemeToggle'
import UserMenu from './UserMenu'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
  { to: '/admin/orders', label: 'Orders', icon: <ShoppingOutlined /> },
  { to: '/admin/customers', label: 'Customers', icon: <TeamOutlined /> },
  { to: '/admin/products', label: 'Products', icon: <AppstoreOutlined /> },
  { to: '/admin/categories', label: 'Categories', icon: <TagsOutlined /> },
  { to: '/admin/coupons', label: 'Coupons', icon: <PercentageOutlined /> },
  { to: '/admin/messages', label: 'Messages', icon: <MailOutlined /> },
]

function navClass({ isActive }) {
  return `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-coral/10 text-highlight' : 'text-subtle hover:bg-muted hover:text-ink'
  }`
}

// Shell for admin pages: sidebar navigation on desktop, a tab row on small
// screens, and a top bar with the signed-in user's menu.
export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-page lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-line px-6">
          <Logo to="/admin/dashboard" />
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-subtle">
            Admin
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-faint">Store</p>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-4">
          <Link
            to="/products"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-subtle hover:bg-muted hover:text-ink"
          >
            <ExportOutlined />
            View store
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <Logo to="/admin/dashboard" />
          </div>
          <span className="hidden text-sm text-subtle lg:inline">Store management</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:px-6 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
          <Link to="/products" className={navClass({ isActive: false })}>
            <ExportOutlined />
            View store
          </Link>
        </nav>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
