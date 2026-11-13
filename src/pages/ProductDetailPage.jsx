import { useEffect, useState } from 'react'
import { Breadcrumb, Button, Skeleton, Tag } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Link, useParams } from 'react-router-dom'
import StoreLayout from '../components/layout/StoreLayout'
import AddToCartButton from '../components/AddToCartButton'
import WishlistButton from '../components/WishlistButton'
import ProductImage from '../components/ProductImage'
import QuantityStepper from '../components/QuantityStepper'
import StockBadge from '../components/StockBadge'
import ShopLogo from '../components/ShopLogo'
import ProductReviews from '../components/reviews/ProductReviews'
import RatingStars from '../components/reviews/RatingStars'
import * as productApi from '../api/productApi'
import { formatPrice } from '../utils/formatPrice'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    async function loadProduct() {
      setLoading(true)
      setLoadError(null)
      try {
        const { data } = await productApi.fetchProduct(id)
        setProduct(data.product)
        setSelectedImageIndex(0)
        setQuantity(1)
      } catch (err) {
        setLoadError(err?.response?.data?.message || 'Could not load this product.')
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [id])

  const images = product?.images || []
  const selectedImage = images[selectedImageIndex]

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : loadError ? (
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface shadow-card p-10 text-center">
            <h1 className="text-lg font-semibold text-ink">Product unavailable</h1>
            <p className="mt-1 text-sm text-subtle">{loadError}</p>
            <Link to="/products">
              <Button type="primary" icon={<ArrowLeftOutlined />} className="mt-6">
                Back to shop
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <Breadcrumb
              className="mb-6"
              items={[
                { title: <Link to="/products">Shop</Link> },
                { title: product.category?.name || 'Uncategorized' },
                { title: product.name },
              ]}
            />

            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <div className="aspect-square overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                  {/* key: a fresh ProductImage per image, so a broken image
                      doesn't keep the placeholder after switching. */}
                  <ProductImage
                    key={selectedImage?.url}
                    src={selectedImage?.url}
                    alt={product.name}
                    fit="contain"
                    className="h-full w-full"
                  />
                </div>
                {images.length > 1 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {images.map((image, index) => (
                      <button
                        key={image._id}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`h-20 w-20 overflow-hidden rounded-lg border-2 bg-surface transition ${
                          index === selectedImageIndex ? 'border-link' : 'border-line hover:border-line-strong'
                        }`}
                      >
                        <ProductImage src={image.url} alt={`${product.name} ${index + 1}`} className="h-full w-full" compact />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-highlight">
                  {product.category?.name || 'Uncategorized'}
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{product.name}</h1>
                <a href="#reviews" className="mt-2 inline-block">
                  <RatingStars average={product.ratingAverage} count={product.ratingCount} size={16} />
                </a>
                <div className="mt-4 flex items-center gap-4">
                  <span className="text-3xl font-bold text-highlight">{formatPrice(product.price)}</span>
                  <StockBadge stock={product.stock} />
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {product.stock > 0 && (
                    <QuantityStepper value={quantity} max={Math.min(product.stock, 99)} onChange={setQuantity} />
                  )}
                  <AddToCartButton product={product} quantity={quantity} size="large" />
                  <WishlistButton product={product} size="large" />
                </div>

                {/* Who sells it, with a link to the rest of their shop. */}
                {product.shop?.slug && (
                  <Link
                    to={`/shops/${product.shop.slug}`}
                    className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card hover:border-coral/30"
                  >
                    <ShopLogo shop={product.shop} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-subtle">Sold by</span>
                      <span className="block truncate font-semibold text-ink">{product.shop.name}</span>
                    </span>
                    {product.shop.isOfficial && <Tag color="blue">Official</Tag>}
                    <span className="text-sm font-medium text-link">Visit shop</span>
                  </Link>
                )}

                <div className="mt-8 border-t border-line pt-8">
                  <h2 className="text-sm font-semibold text-ink">Description</h2>
                  <p className="mt-3 whitespace-pre-wrap leading-relaxed text-subtle">
                    {product.description || 'No description available.'}
                  </p>
                </div>

                <dl className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-line bg-surface shadow-card p-5 text-sm">
                  <div>
                    <dt className="text-subtle">Category</dt>
                    <dd className="mt-1 font-medium text-ink">{product.category?.name || 'Uncategorized'}</dd>
                  </div>
                  <div>
                    <dt className="text-subtle">Availability</dt>
                    <dd className="mt-1 font-medium text-ink">
                      {product.stock > 0 ? `${product.stock} in stock` : 'Currently unavailable'}
                    </dd>
                  </div>
                </dl>

                <Link to="/products" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-link hover:text-highlight">
                  <ArrowLeftOutlined />
                  Continue shopping
                </Link>
              </div>
            </div>
            <ProductReviews
              productId={product._id}
              // New review totals → update the stars at the top of the page too.
              onSummaryChange={(summary) =>
                setProduct((previous) => ({ ...previous, ratingAverage: summary.average, ratingCount: summary.count }))
              }
            />
          </>
        )}
      </div>
    </StoreLayout>
  )
}
