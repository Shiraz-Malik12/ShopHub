import { Link } from 'react-router-dom'
import { ShoppingOutlined } from '@ant-design/icons'

// Brand mark used in the store header, admin sidebar and auth screens.
// `light` is for dark backgrounds (the auth page's navy panel).
export default function Logo({ to = '/products', light = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-xl text-base ${
          light ? 'bg-white/15 text-white' : 'bg-brand text-white'
        }`}
      >
        <ShoppingOutlined />
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>ShopHub</span>
    </Link>
  )
}
