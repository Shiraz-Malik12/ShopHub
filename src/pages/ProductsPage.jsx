import { useEffect, useState } from 'react'
import { Alert, Button, Card, Empty, Spin } from 'antd'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import * as productApi from '../api/productApi'

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
      setLoadError(err?.response?.data?.message || 'Could not load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-100">Products</h1>
          <p className="mt-2 text-slate-400">Browse our available products.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spin size="large" /></div>
        ) : loadError ? (
          <Alert
            type="error"
            showIcon
            message="Could not load products"
            description={loadError}
            action={<Button size="small" onClick={loadProducts}>Retry</Button>}
          />
        ) : products.length === 0 ? (
          <Empty description="No products available yet" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card
                key={product._id}
                title={product.name}
                extra={<span className="text-slate-400">${product.price.toFixed(2)}</span>}
                className="border-slate-800 bg-slate-900"
              >
                <p className="mb-4 min-h-12 text-slate-400">
                  {product.description || 'No description available.'}
                </p>
                <p className="mb-4 text-sm text-slate-400">
                  Category: {product.category?.name || 'Uncategorized'}
                </p>
                <Button type="primary" block>
                  <Link to={`/products/${product._id}`}>View details</Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
