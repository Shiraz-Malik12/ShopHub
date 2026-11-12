import { TagOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import AddToCartButton from './AddToCartButton'
import ProductImage from './ProductImage'
import RatingStars from './reviews/RatingStars'
import StockBadge from './StockBadge'
import WishlistButton from './WishlistButton'
import { formatPrice } from '../utils/formatPrice'

// One product in the customer listing. Receives a single product (from
// GET /api/products) as a prop and only displays it — no fetching here.
// Design: a soft rounded card with the photo inset, a bold title, a quiet
// category line, a small details row, and a pill button + round heart.
export default function ProductCard({ product }) {
  const productUrl = `/products/${product._id}`

  return (
    <article className="group flex flex-col rounded-[28px] border border-line bg-surface shadow-card p-3 transition duration-200 hover:-translate-y-1 hover:border-coral/30 hover:shadow-card-hover">
      <Link to={productUrl} className="block aspect-square overflow-hidden rounded-[22px] bg-muted">
        <ProductImage
          src={product.images?.[0]?.url}
          alt={product.name}
          className="h-full w-full transition duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
        <Link to={productUrl} className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-ink hover:text-highlight">
          {product.name}
        </Link>
        <p className="mt-0.5 text-sm text-faint">{product.category?.name || 'Uncategorized'}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <TagOutlined />
            <span className="font-semibold text-highlight">{formatPrice(product.price)}</span>
          </span>
          <StockBadge stock={product.stock} />
        </div>
        <div className="mt-2">
          <RatingStars average={product.ratingAverage} count={product.ratingCount} size={12} />
        </div>

        {/* mt-auto pushes the buttons to the card's bottom, so they line up
            across a row even when names wrap onto two lines. */}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <AddToCartButton product={product} size="large" className="flex-1" />
          <WishlistButton product={product} round />
        </div>
      </div>
    </article>
  )
}
