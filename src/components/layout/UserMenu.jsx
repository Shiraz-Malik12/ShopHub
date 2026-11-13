import { Avatar, Dropdown } from 'antd'
import { AppstoreOutlined, DownOutlined, FileTextOutlined, HeartOutlined, LogoutOutlined, SettingOutlined, ShopOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Avatar + dropdown for a signed-in user. Shared by the store header and
// the admin top bar so both offer the same account/admin/sign-out links.
export default function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const items = [
    {
      key: 'who',
      disabled: true,
      label: (
        <div className="py-1">
          <div className="font-medium text-ink">{user.name}</div>
          <div className="text-xs text-subtle">{user.email}</div>
        </div>
      ),
    },
    { type: 'divider' },
    { key: 'shop', icon: <AppstoreOutlined />, label: <Link to="/products">Shop</Link> },
    { key: 'cart', icon: <ShoppingCartOutlined />, label: <Link to="/cart">My cart</Link> },
    { key: 'wishlist', icon: <HeartOutlined />, label: <Link to="/wishlist">My wishlist</Link> },
    { key: 'orders', icon: <FileTextOutlined />, label: <Link to="/orders">My orders</Link> },
    { key: 'account', icon: <UserOutlined />, label: <Link to="/account">My account</Link> },
    ...(user.role === 'admin'
      ? [{ key: 'admin', icon: <SettingOutlined />, label: <Link to="/admin/dashboard">Admin dashboard</Link> }]
      : [
          {
            key: 'my-shop',
            icon: <ShopOutlined />,
            label: <Link to="/open-shop">{user.role === 'seller' ? 'My shop' : 'Sell on ShopHub'}</Link>,
          },
        ]),
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', danger: true, onClick: handleLogout },
  ]

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
      <button type="button" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-muted">
        <Avatar size={32} style={{ backgroundColor: 'var(--brand)' }}>
          {user.name?.[0]?.toUpperCase()}
        </Avatar>
        <span className="hidden text-sm font-medium text-soft sm:inline">{user.name}</span>
        <DownOutlined className="text-[10px] text-faint" />
      </button>
    </Dropdown>
  )
}
