// The ShopHub "Hub Bag" icon: a shopping bag holding a connected hub
// (many products, one place to shop). Drawn as SVG so it stays sharp at any
// size. Always the same brand colors — blue bag, white hub, coral center —
// in light mode, dark mode and on every page, so the logo never changes.
export const BRAND_BLUE = '#2457d6'
export const BRAND_CORAL = '#ff6b4a'

export default function BrandMark({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* handle */}
      <path d="M20 19V17.3a12 12 0 0 1 24 0V19" fill="none" stroke={BRAND_BLUE} strokeWidth="6" />
      {/* bag body — slightly narrower at the bottom, rounded base */}
      <path d="M7.2 18.8h49.6l-3.2 40a4 4 0 0 1-4 4H14.4a4 4 0 0 1-4-4z" fill={BRAND_BLUE} />
      {/* hub: three connected points around a coral center */}
      <g stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round">
        <line x1="32" y1="41.4" x2="20" y2="32.7" />
        <line x1="32" y1="41.4" x2="44" y2="32.7" />
        <line x1="32" y1="41.4" x2="32" y2="54.9" />
      </g>
      <g fill="#ffffff">
        <circle cx="20" cy="32.7" r="3" />
        <circle cx="44" cy="32.7" r="3" />
        <circle cx="32" cy="54.9" r="3" />
      </g>
      <circle cx="32" cy="41.4" r="5.3" fill={BRAND_CORAL} />
    </svg>
  )
}
