// A shop's logo, or — if it has none — its first letter in a circle, so
// every shop has a recognisable mark. `shop`: { name, logo } where logo is
// the image address (or null). Products' `shop.logo` is { url } instead,
// so both shapes are accepted.
export default function ShopLogo({ shop, size = 40, className = '' }) {
  const src = typeof shop?.logo === 'string' ? shop.logo : shop?.logo?.url
  const style = { width: size, height: size }

  if (src) {
    return (
      <img
        src={src}
        alt={`${shop.name} logo`}
        style={style}
        className={`shrink-0 rounded-full border border-line bg-surface object-cover ${className}`}
      />
    )
  }
  return (
    <span
      style={{ ...style, fontSize: Math.round(size * 0.42) }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-coral/10 font-semibold text-highlight ${className}`}
      aria-hidden="true"
    >
      {shop?.name?.[0]?.toUpperCase() || '?'}
    </span>
  )
}
