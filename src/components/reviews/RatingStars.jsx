import { Rate } from 'antd'

// Read-only stars + "4.5 (12)". Used on product cards and the product page.
// The number is always written next to the stars, so the rating never
// depends on reading the star shapes alone.
export default function RatingStars({ average, count, size = 14 }) {
  if (!count) {
    return <span className="text-xs text-slate-500">No reviews yet</span>
  }
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Rated ${average} out of 5 from ${count} reviews`}>
      <Rate disabled allowHalf value={average} style={{ fontSize: size, color: '#fbbf24' }} />
      <span className="text-xs text-slate-400">
        {average.toFixed(1)} ({count})
      </span>
    </span>
  )
}
