import { AppstoreOutlined, DashboardOutlined, MailOutlined, PercentageOutlined, ShopOutlined, ShoppingOutlined, TagsOutlined, TeamOutlined } from '@ant-design/icons'
import PanelLayout from './PanelLayout'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
  { to: '/admin/shops', label: 'Shops', icon: <ShopOutlined /> },
  { to: '/admin/orders', label: 'Orders', icon: <ShoppingOutlined /> },
  { to: '/admin/customers', label: 'Customers', icon: <TeamOutlined /> },
  { to: '/admin/products', label: 'Products', icon: <AppstoreOutlined /> },
  { to: '/admin/categories', label: 'Categories', icon: <TagsOutlined /> },
  { to: '/admin/coupons', label: 'Coupons', icon: <PercentageOutlined /> },
  { to: '/admin/messages', label: 'Messages', icon: <MailOutlined /> },
]

// Shell for admin pages — the whole marketplace.
export default function AdminLayout({ children }) {
  return (
    <PanelLayout navItems={NAV_ITEMS} badge="Admin" homeTo="/admin/dashboard" sectionLabel="Marketplace" topLabel="Marketplace management">
      {children}
    </PanelLayout>
  )
}
