import { useEffect, useState } from 'react'
import { Button, Skeleton } from 'antd'
import { ShopOutlined } from '@ant-design/icons'
import { Link, useParams } from 'react-router-dom'
import StoreLayout from '../components/layout/StoreLayout'
import ProductsPage from './ProductsPage'
import { fetchPublicShop } from '../api/shopApi'

// /shops/:slug — one seller's shop: their name, logo and description on
// top, and only their products below (the normal product list, limited to
// this shop). A shop that is pending, rejected or suspended isn't found.
export default function ShopPage() {
  const { slug } = useParams()
  // undefined = loading, null = not found
  const [shop, setShop] = useState(undefined)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    let ignore = false
    setShop(undefined)
    setLoadError(null)
    fetchPublicShop(slug)
      .then(({ data }) => !ignore && setShop(data.shop))
      .catch((err) => {
        if (ignore) return
        if (err?.response?.status === 404 || err?.response?.status === 400) setShop(null)
        else setLoadError(err?.response?.data?.message || 'Could not load this shop. Please try again.')
      })
    return () => {
      ignore = true
    }
  }, [slug])

  if (shop) return <ProductsPage key={shop.id} shop={shop} />

  return (
    <StoreLayout>
      <div className="page-container py-10">
        {shop === undefined && !loadError ? (
          <div className="rounded-[28px] border border-line bg-surface p-10 shadow-card">
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </div>
        ) : (
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-10 text-center shadow-card">
            <ShopOutlined className="text-3xl text-faint" />
            <h1 className="mt-4 text-lg font-semibold text-ink">{loadError ? 'Could not load this shop' : 'Shop not found'}</h1>
            <p className="mt-1 text-sm text-subtle">
              {loadError || "This shop doesn't exist or isn't selling right now."}
            </p>
            <Link to="/products">
              <Button type="primary" className="mt-6">
                Browse all products
              </Button>
            </Link>
          </div>
        )}
      </div>
    </StoreLayout>
  )
}
