import { useEffect, useState } from 'react'
import { Alert, App as AntdApp, Button, Popconfirm, Skeleton, Steps } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Link, useLocation, useParams } from 'react-router-dom'
import StoreLayout from '../components/layout/StoreLayout'
import OrderStatusTag from '../components/OrderStatusTag'
import ProductImage from '../components/ProductImage'
import * as orderApi from '../api/orderApi'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/formatDate'
import { formatPrice } from '../utils/formatPrice'
import { ORDER_STATUS, ORDER_STEPS } from '../utils/orderStatus'

// One order: its progress, items, delivery address and totals. Also the
// confirmation page right after checkout (location.state.justPlaced).
export default function OrderDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const { message } = AntdApp.useApp()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const justPlaced = Boolean(location.state?.justPlaced)

  useEffect(() => {
    async function loadOrder() {
      setLoading(true)
      setLoadError(null)
      try {
        const { data } = await orderApi.fetchOrder(id)
        setOrder(data.order)
      } catch (err) {
        setLoadError(err?.response?.data?.message || 'Could not load this order.')
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [id])

  async function handleCancel() {
    setCancelling(true)
    try {
      const { data } = await orderApi.cancelOrder(order._id)
      // The cancel response has no customer details — keep the ones we have.
      setOrder((previous) => ({ ...data.order, user: previous.user }))
      message.success('Order cancelled')
    } catch (err) {
      message.error(err?.response?.data?.message || 'Could not cancel this order. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  // Only the customer who placed it can cancel, and only while it is pending.
  const canCancel = order?.status === 'pending' && order?.user?._id === user?.id

  return (
    <StoreLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300">
          <ArrowLeftOutlined />
          My orders
        </Link>

        {loading ? (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : loadError ? (
          <div className="mx-auto mt-6 max-w-md rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h1 className="text-lg font-semibold text-slate-100">Order unavailable</h1>
            <p className="mt-1 text-sm text-slate-400">{loadError}</p>
            <Link to="/orders">
              <Button type="primary" className="mt-6">Back to my orders</Button>
            </Link>
          </div>
        ) : (
          <>
            {justPlaced && (
              <Alert
                type="success"
                showIcon
                className="mt-6"
                title="Thank you! Your order has been placed."
                description="You will pay in cash when it is delivered. You can follow its progress on this page."
              />
            )}

            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-100">Order {order.orderNumber}</h1>
                <p className="mt-1 text-sm text-slate-400">Placed on {formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusTag status={order.status} />
                {canCancel && (
                  <Popconfirm
                    title="Cancel this order?"
                    description="This cannot be undone."
                    okText="Cancel order"
                    cancelText="Keep it"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleCancel}
                  >
                    <Button danger loading={cancelling}>Cancel order</Button>
                  </Popconfirm>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
              {order.status === 'cancelled' ? (
                <p className="text-sm text-slate-400">This order was cancelled. Nothing will be delivered or charged.</p>
              ) : (
                <Steps
                  size="small"
                  // Delivered = every step done, so point past the last step
                  // (all ticks) instead of showing it as "in progress".
                  current={order.status === 'delivered' ? ORDER_STEPS.length : ORDER_STEPS.indexOf(order.status)}
                  items={ORDER_STEPS.map((status) => ({ title: ORDER_STATUS[status].label }))}
                />
              )}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 lg:col-span-2">
                <h2 className="border-b border-slate-800 px-6 py-4 font-semibold text-slate-100">
                  Items ({order.itemCount})
                </h2>
                <ul className="divide-y divide-slate-800">
                  {order.items.map((item) => (
                    <li key={item.product} className="flex items-center gap-4 px-6 py-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-800">
                        <ProductImage src={item.image} alt={item.name} className="h-full w-full" compact />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-100">{item.name}</p>
                        <p className="text-sm text-slate-400">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-100">{formatPrice(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="font-semibold text-slate-100">Delivery address</h2>
                  <address className="mt-3 space-y-1 text-sm not-italic text-slate-400">
                    <p className="font-medium text-slate-100">{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.addressLine}</p>
                    <p>
                      {order.shippingAddress.city}
                      {order.shippingAddress.postalCode && `, ${order.shippingAddress.postalCode}`}
                    </p>
                    <p>{order.shippingAddress.phone}</p>
                    {order.shippingAddress.notes && <p className="pt-2 italic">“{order.shippingAddress.notes}”</p>}
                  </address>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="font-semibold text-slate-100">Payment summary</h2>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Subtotal</dt>
                      <dd className="font-medium text-slate-100">{formatPrice(order.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Shipping</dt>
                      <dd className="font-medium text-emerald-400">Free</dd>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-3 text-base">
                      <dt className="font-semibold text-slate-100">Total</dt>
                      <dd className="font-bold text-slate-100">{formatPrice(order.total)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Payment</dt>
                      <dd className="font-medium text-slate-100">Cash on delivery</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </StoreLayout>
  )
}
