import { useEffect, useState } from 'react'
import { Button, Empty, Skeleton } from 'antd'
import { ReloadOutlined, RightOutlined, WarningOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import StoreLayout from '../components/layout/StoreLayout'
import OrderStatusTag from '../components/OrderStatusTag'
import ProductImage from '../components/ProductImage'
import * as orderApi from '../api/orderApi'
import { formatDate } from '../utils/formatDate'
import { formatPrice } from '../utils/formatPrice'

const MAX_THUMBNAILS = 4

// "My orders": every order the signed-in customer has placed, newest first.
export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  async function loadOrders() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data } = await orderApi.fetchMyOrders()
      setOrders(data.orders)
    } catch (err) {
      setLoadError(err?.response?.data?.message || 'Could not load your orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  return (
    <StoreLayout>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-ink">My orders</h1>
          <p className="mt-2 text-subtle">Track and review everything you have ordered.</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((key) => (
              <div key={key} className="rounded-2xl border border-line bg-surface shadow-card p-6">
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface shadow-card p-10 text-center">
            <WarningOutlined className="text-3xl text-danger" />
            <h2 className="mt-4 text-lg font-semibold text-ink">Could not load your orders</h2>
            <p className="mt-1 text-sm text-subtle">{loadError}</p>
            <Button type="primary" icon={<ReloadOutlined />} className="mt-6" onClick={loadOrders}>
              Try again
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface shadow-card py-16">
            <Empty description="You have not placed any orders yet.">
              <Link to="/products">
                <Button type="primary">Start shopping</Button>
              </Link>
            </Empty>
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order._id}>
                <Link
                  to={`/orders/${order._id}`}
                  className="group block rounded-2xl border border-line bg-surface shadow-card p-5 transition hover:border-coral/40 hover:shadow-card-hover"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{order.orderNumber}</p>
                      <p className="text-sm text-subtle">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <OrderStatusTag status={order.status} />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {order.items.slice(0, MAX_THUMBNAILS).map((item) => (
                        <div key={item.product} className="h-12 w-12 overflow-hidden rounded-lg border border-line">
                          <ProductImage src={item.image} alt={item.name} className="h-full w-full" compact />
                        </div>
                      ))}
                      {order.items.length > MAX_THUMBNAILS && (
                        <span className="text-sm text-subtle">+{order.items.length - MAX_THUMBNAILS} more</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-bold text-ink">{formatPrice(order.total)}</p>
                        <p className="text-xs text-subtle">
                          {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <RightOutlined className="text-faint transition group-hover:translate-x-0.5 group-hover:text-highlight" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </StoreLayout>
  )
}
