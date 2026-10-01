// Simple stock status for customers: stock > 0 → In Stock, 0 → Out of Stock.
export default function StockBadge({ stock }) {
  const inStock = stock > 0
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        inStock ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {inStock ? 'In Stock' : 'Out of Stock'}
    </span>
  )
}
