import { useEffect, useState } from 'react'
import { Breadcrumb, Button, Skeleton } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Link, useParams } from 'react-router-dom'
import StoreLayout from '../components/layout/StoreLayout'
import ProductImage from '../components/ProductImage'
import StockBadge from '../components/StockBadge'
import * as productApi from '../api/productApi'
import { formatPrice } from '../utils/formatPrice'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    async function loadProduct() {
      setLoading(true)
      setLoadError(null)
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

  const images = product?.images || []
  const selectedImage = images[selectedImageIndex]

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-2xl bg-slate-800" />
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : loadError ? (
          <div className="mx-auto max-w-md rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h1 className="text-lg font-semibold text-slate-100">Product unavailable</h1>
            <p className="mt-1 text-sm text-slate-400">{loadError}</p>
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
                <div className="aspect-square overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
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
                        className={`h-20 w-20 overflow-hidden rounded-lg border-2 bg-slate-900 transition ${
                          index === selectedImageIndex ? 'border-indigo-500' : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <ProductImage src={image.url} alt={`${product.name} ${index + 1}`} className="h-full w-full" compact />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-indigo-400">
                  {product.category?.name || 'Uncategorized'}
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">{product.name}</h1>
                <div className="mt-4 flex items-center gap-4">
                  <span className="text-3xl font-bold text-slate-100">{formatPrice(product.price)}</span>
                  <StockBadge stock={product.stock} />
                </div>

                <div className="mt-8 border-t border-slate-800 pt-8">
                  <h2 className="text-sm font-semibold text-slate-100">Description</h2>
                  <p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate-400">
                    {product.description || 'No description available.'}
                  </p>
                </div>

                <dl className="mt-8 grid grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm">
                  <div>
                    <dt className="text-slate-400">Category</dt>
                    <dd className="mt-1 font-medium text-slate-100">{product.category?.name || 'Uncategorized'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Availability</dt>
                    <dd className="mt-1 font-medium text-slate-100">
                      {product.stock > 0 ? `${product.stock} in stock` : 'Currently unavailable'}
                    </dd>
                  </div>
                </dl>

                <Link to="/products" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300">
                  <ArrowLeftOutlined />
                  Continue shopping
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </StoreLayout>
  )
}
