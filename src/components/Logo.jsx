import { Link } from 'react-router-dom'
import { ShoppingOutlined } from '@ant-design/icons'

// Brand mark used in the store header, admin sidebar and auth screens.
// `light` is for dark backgrounds (the auth page's colored panel).
export default function Logo({ to = '/products', light = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${
          light ? 'bg-white/15 text-white' : 'bg-indigo-600 text-white'
        }`}
      >
        <ShoppingOutlined />
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-slate-100'}`}>ShopHub</span>
    </Link>
  )
}
