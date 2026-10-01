import { useEffect, useState } from 'react'
import { Button, Empty, Skeleton } from 'antd'
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons'
import StoreLayout from '../components/layout/StoreLayout'
import ProductCard from '../components/ProductCard'
import * as productApi from '../api/productApi'

const SKELETON_CARDS = 8

// Customer storefront listing. The backend (GET /api/products) already
// returns only products customers may see, so nothing is filtered here.
export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  async function loadProducts() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data } = await productApi.fetchProducts()
      setProducts(data.products)
    } catch (err) {
      setLoadError(err?.response?.data?.message || 'Could not load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  return (
    <StoreLayout>
      <section className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">All products</h1>
          <p className="mt-2 text-slate-400">
            {loading || loadError
              ? 'Browse our full catalog.'
              : `${products.length} ${products.length === 1 ? 'product' : 'products'} available`}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading products...">
            {Array.from({ length: SKELETON_CARDS }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                <div className="aspect-square animate-pulse bg-slate-800" />
                <div className="p-4">
                  <Skeleton active title={false} paragraph={{ rows: 3 }} />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="mx-auto max-w-md rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <WarningOutlined className="text-3xl text-rose-500" />
            <h2 className="mt-4 text-lg font-semibold text-slate-100">Could not load products</h2>
            <p className="mt-1 text-sm text-slate-400">{loadError}</p>
            <Button type="primary" icon={<ReloadOutlined />} className="mt-6" onClick={loadProducts}>
              Try again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 py-16">
            <Empty description="No products available." />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  )
}
