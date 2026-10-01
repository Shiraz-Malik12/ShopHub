import { AppstoreOutlined, ExportOutlined, TagsOutlined } from '@ant-design/icons'
import { Link, NavLink } from 'react-router-dom'
import Logo from '../Logo'
import UserMenu from './UserMenu'

const NAV_ITEMS = [
  { to: '/admin/products', label: 'Products', icon: <AppstoreOutlined /> },
  { to: '/admin/categories', label: 'Categories', icon: <TagsOutlined /> },
]

function navClass({ isActive }) {
  return `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-indigo-500/10 text-indigo-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`
}

// Shell for admin pages: sidebar navigation on desktop, a tab row on small
// screens, and a top bar with the signed-in user's menu.
export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-800 bg-slate-900 lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
          <Logo to="/admin/products" />
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Admin
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Catalog</p>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <Link
            to="/products"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <ExportOutlined />
            View store
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <Logo to="/admin/products" />
          </div>
          <span className="hidden text-sm text-slate-400 lg:inline">Store management</span>
          <UserMenu />
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
