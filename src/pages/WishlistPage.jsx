import { useEffect, useState } from 'react'
import { Button, Empty, Skeleton } from 'antd'
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import StoreLayout from '../components/layout/StoreLayout'
import ProductCard from '../components/ProductCard'
import * as wishlistApi from '../api/wishlistApi'
import { useWishlist } from '../context/WishlistContext'

// "My wishlist": the products the signed-in customer saved with the heart.
export default function WishlistPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const { isSaved } = useWishlist()

  async function loadWishlist() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data } = await wishlistApi.fetchWishlist()
      setProducts(data.products)
    } catch (err) {
      setLoadError(err?.response?.data?.message || 'Could not load your wishlist. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWishlist()
  }, [])

  // Un-hearting a card on this page removes it from the context right away,
  // so we hide it here too — no need to reload the whole list.
  const visibleProducts = products.filter((product) => isSaved(product._id))

  return (
    <StoreLayout>
      <section className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">My wishlist</h1>
          <p className="mt-2 text-slate-400">Products you saved for later.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((key) => (
              <div key={key} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <Skeleton.Image active className="!h-48 !w-full" />
                <Skeleton active paragraph={{ rows: 2 }} className="mt-4" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="mx-auto max-w-md rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <WarningOutlined className="text-3xl text-rose-500" />
            <h2 className="mt-4 text-lg font-semibold text-slate-100">Could not load your wishlist</h2>
            <p className="mt-1 text-sm text-slate-400">{loadError}</p>
            <Button type="primary" icon={<ReloadOutlined />} className="mt-6" onClick={loadWishlist}>
              Try again
            </Button>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 py-16">
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
