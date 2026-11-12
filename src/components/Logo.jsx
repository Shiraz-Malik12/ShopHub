import { Link } from 'react-router-dom'
import BrandMark from './BrandMark'

// Brand logo used in the store header, admin sidebar and auth screens:
// the Hub Bag mark + "Shop" "Hub" in a bold geometric font. The mark and
// the coral "Hub" never change; only "Shop" switches between navy and white
// so it stays readable on light and dark backgrounds.
// `light` is for the dark navy panel on the auth pages.
export default function Logo({ to = '/products', light = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2" aria-label="ShopHub home">
      <BrandMark size={30} />
      <span className="font-brand text-xl font-bold leading-none tracking-tight">
        <span className={light ? 'text-white' : 'text-ink'}>Shop</span>
        <span className="text-[#e8502e]">Hub</span>
      </span>
    </Link>
  )
}
