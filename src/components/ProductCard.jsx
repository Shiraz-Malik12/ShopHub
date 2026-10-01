import { Button } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import ProductImage from './ProductImage'
import StockBadge from './StockBadge'
import { formatPrice } from '../utils/formatPrice'

// One product in the customer listing. Receives a single product (from
// GET /api/products) as a prop and only displays it — no fetching here.
export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const productUrl = `/products/${product._id}`

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link to={productUrl} className="block aspect-square overflow-hidden bg-slate-800">
        <ProductImage
          src={product.images?.[0]?.url}
          alt={product.name}
          className="h-full w-full transition duration-300 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {product.category?.name || 'Uncategorized'}
        </p>
        <Link to={productUrl} className="mt-1 line-clamp-2 font-semibold text-slate-100 hover:text-indigo-400">
          {product.name}
        </Link>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-slate-100">{formatPrice(product.price)}</span>
          <StockBadge stock={product.stock} />
        </div>

        {/* mt-auto pushes the button to the card's bottom, so buttons line up
            across a row even when names wrap onto two lines. */}
        <div className="mt-auto pt-4">
          <Button block onClick={() => navigate(productUrl)}>
            View Product
          </Button>
        </div>
      </div>
    </article>
  )
}
