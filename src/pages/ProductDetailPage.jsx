import { useEffect, useState } from 'react'
import { Alert, Button, Card, Spin } from 'antd'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import * as productApi from '../api/productApi'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    async function loadProduct() {
      try {
        const { data } = await productApi.fetchProduct(id)
        setProduct(data.product)
        setSelectedImageIndex(0)
      } catch (err) {
        setLoadError(err?.response?.data?.message || 'Could not load this product.')
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [id])

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Button type="link" className="mb-6 px-0"><Link to="/products">Back to products</Link></Button>
        {loading ? (
          <div className="flex justify-center py-16"><Spin size="large" /></div>
        ) : loadError ? (
          <Alert type="error" showIcon message="Product unavailable" description={loadError} />
        ) : (
          <Card title={product.name} className="border-slate-800 bg-slate-900">
            {product.images?.length > 0 && (
              <div className="mb-6">
                <img
                  src={product.images[selectedImageIndex]?.url}
                  alt={product.name}
                  className="h-[28rem] w-full rounded-lg bg-slate-800 object-contain"
                />
                {product.images.length > 1 && (
                  <div className="mt-3 flex gap-2">
                    {product.images.map((image, index) => (
                      <button
                        key={image._id}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`h-20 w-20 overflow-hidden rounded border-2 ${index === selectedImageIndex ? 'border-indigo-500' : 'border-transparent'}`}
                      >
                        <img src={image.url} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="mb-6 whitespace-pre-wrap text-slate-300">
              {product.description || 'No description available.'}
            </p>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-slate-400">Price</dt>
                <dd className="text-xl font-semibold text-slate-100">${product.price.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-400">Stock</dt>
                <dd className="text-xl font-semibold text-slate-100">{product.stock}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-400">Category</dt>
                <dd className="text-xl font-semibold text-slate-100">{product.category?.name || 'Uncategorized'}</dd>
              </div>
            </dl>
          </Card>
        )}
      </main>
    </div>
  )
}
