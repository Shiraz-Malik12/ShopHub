import { useEffect, useState } from 'react'
import { AppstoreOutlined, DashboardOutlined, PercentageOutlined, ShopOutlined, ShoppingOutlined } from '@ant-design/icons'
import PanelLayout from './PanelLayout'
import { fetchSellerShop } from '../../api/shopApi'

const NAV_ITEMS = [
  { to: '/seller/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
  { to: '/seller/orders', label: 'Orders', icon: <ShoppingOutlined /> },
  { to: '/seller/products', label: 'Products', icon: <AppstoreOutlined /> },
  { to: '/seller/coupons', label: 'Coupons', icon: <PercentageOutlined /> },
  { to: '/seller/shop', label: 'Shop profile', icon: <ShopOutlined /> },
]

// Shell for seller pages — one shop. Shows the shop's name so the seller
// always knows which shop they're managing.
export default function SellerLayout({ children }) {
  const [shopName, setShopName] = useState('')

  useEffect(() => {
    let ignore = false
    fetchSellerShop()
      .then(({ data }) => !ignore && setShopName(data.shop.name))
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [])

  return (
    <PanelLayout
      navItems={NAV_ITEMS}
      badge="Seller"
      homeTo="/seller/dashboard"
      sectionLabel={shopName || 'My shop'}
      topLabel={shopName ? `Managing ${shopName}` : 'Seller panel'}
    >
      {children}
    </PanelLayout>
  )
}
