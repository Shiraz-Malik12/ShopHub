// Stock status for customers:
// 0 → Out of Stock,  1–5 → Only N left!,  6 or more → In Stock.
export default function StockBadge({ stock }) {
  const inStock = stock > 0
  const lowStock = stock > 0 && stock <= 5

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        lowStock
          ? 'bg-amber-500/10 text-amber-300'
          : inStock
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-rose-500/10 text-rose-400'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          lowStock ? 'bg-amber-500' : inStock ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />
      {lowStock ? `Only ${stock} left!` : inStock ? 'In Stock' : 'Out of Stock'}
    </span>
  )
}