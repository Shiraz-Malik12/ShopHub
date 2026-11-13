import { useEffect, useState } from 'react'
import { AppstoreOutlined, ShopOutlined } from '@ant-design/icons'
import PanelLayout from './PanelLayout'
import { fetchSellerShop } from '../../api/shopApi'

// Orders, coupons and a dashboard join this list in the next phases.
const NAV_ITEMS = [
  { to: '/seller/products', label: 'Products', icon: <AppstoreOutlined /> },
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
      homeTo="/seller/products"
      sectionLabel={shopName || 'My shop'}
      topLabel={shopName ? `Managing ${shopName}` : 'Seller panel'}
    >
      {children}
    </PanelLayout>
  )
}
