import { useEffect, useState } from 'react'
import { Button, Empty, Skeleton } from 'antd'
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import StoreLayout from '../components/layout/StoreLayout'
import ProductCard from '../components/ProductCard'
import { useWishlist } from '../context/WishlistContext'

// "My wishlist": the products saved with the heart — for guests (saved in
// the browser) and signed-in customers alike. The product data comes from
// WishlistContext.loadProducts(), which asks the server in both cases.
export default function WishlistPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const { owner, isGuest, isSaved, loadProducts } = useWishlist()

  async function loadWishlist() {
    setLoading(true)
    setLoadError(null)
    try {
      setProducts(await loadProducts())
    } catch (err) {
      setLoadError(err?.response?.data?.message || 'Could not load your wishlist. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load once we know who is visiting, and again if that changes (sign in).
  useEffect(() => {
    if (owner) loadWishlist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner])

  // Un-hearting a card on this page removes it from the context right away,
  // so we hide it here too — no need to reload the whole list.
  const visibleProducts = products.filter((product) => isSaved(product._id))

  return (
    <StoreLayout>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-ink">My wishlist</h1>
          <p className="mt-2 text-subtle">
            Products you saved for later.
            {isGuest && ' Sign in to keep them on every device — they move to your account automatically.'}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((key) => (
              <div key={key} className="rounded-2xl border border-line bg-surface shadow-card p-4">
                <Skeleton.Image active className="!h-48 !w-full" />
                <Skeleton active paragraph={{ rows: 2 }} className="mt-4" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface shadow-card p-10 text-center">
            <WarningOutlined className="text-3xl text-danger" />
            <h2 className="mt-4 text-lg font-semibold text-ink">Could not load your wishlist</h2>
            <p className="mt-1 text-sm text-subtle">{loadError}</p>
            <Button type="primary" icon={<ReloadOutlined />} className="mt-6" onClick={loadWishlist}>
              Try again
            </Button>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface shadow-card py-16">
            <Empty description="Your wishlist is empty. Tap the heart on any product to save it here.">
              <Link to="/products">
                <Button type="primary">Browse products</Button>
              </Link>
            </Empty>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  )
}
