import { useEffect, useState } from 'react'
import { Alert, App as AntdApp, Button, Popconfirm, Skeleton, Steps } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import PaymentStatusTag from '../components/PaymentStatusTag'
import * as paymentApi from '../api/paymentApi'
import StoreLayout from '../components/layout/StoreLayout'
import OrderStatusTag from '../components/OrderStatusTag'
import ProductImage from '../components/ProductImage'
import * as orderApi from '../api/orderApi'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/formatDate'
import { formatPrice } from '../utils/formatPrice'
import { ORDER_STATUS, ORDER_STEPS } from '../utils/orderStatus'

// What a cancelled order says about the money. A card order that was paid
// was charged, so "nothing charged" would be wrong — say it's refunded.
// (Same rules as the cancellation email, server/src/utils/orderEmails.js.)
function cancelledMessage(order) {
  if (order.paymentStatus === 'refunded') {
    return `This order was cancelled. Your payment of ${formatPrice(order.total)} has been refunded to your card — it can take 5–10 business days to show on your statement.`
  }
  if (order.paymentStatus === 'refund_failed') {
    return `This order was cancelled. Your payment of ${formatPrice(order.total)} will be refunded — our team is processing it.`
  }
  return 'This order was cancelled. Nothing will be delivered or charged.'
}

// One order: its progress, items, delivery address and totals. Also the
// confirmation page right after checkout (location.state.justPlaced).
export default function OrderDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const { message } = AntdApp.useApp()
  const [order, setOrder] = useState(null)
  // The other orders (other shops' parcels) from the same checkout.
  const [siblings, setSiblings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const [paying, setPaying] = useState(false)
  // Stripe sends the customer back here with ?payment=success or
  // ?payment=cancelled. That's only a HINT for which message to show —
  // whether it's really paid always comes from the server.
  const [searchParams] = useSearchParams()
  const paymentReturn = searchParams.get('payment')

  const justPlaced = Boolean(location.state?.justPlaced)

  useEffect(() => {
    async function loadOrder() {
      setLoading(true)
      setLoadError(null)
      try {
        let { data } = await orderApi.fetchOrder(id)
        // Still waiting for payment? Ask the server to check with Stripe
        // (the customer may have just paid), then load the fresh order.
        if (data.order.paymentStatus === 'awaiting') {
          await paymentApi.fetchCheckoutPayment(data.order.checkoutId).catch(() => {})
          ;({ data } = await orderApi.fetchOrder(id))
        }
        setOrder(data.order)
        setSiblings(data.siblings || [])
      } catch (err) {
        setLoadError(err?.response?.data?.message || 'Could not load this order.')
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [id])

  // "Pay now": a fresh Stripe payment page for whatever is still unpaid.
  async function handlePayNow() {
    setPaying(true)
    try {
      const { data } = await paymentApi.payCheckout(order.checkoutId)
      if (data.paymentUrl) {
        window.location.assign(data.paymentUrl)
        return
      }
      message.success(data.message || 'This order is already paid.')
      window.location.reload()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Could not open the payment page. Please try again.')
      setPaying(false)
    }
  }

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
  const isOwner = order?.user?._id === user?.id
  const canCancel = order?.status === 'pending' && isOwner
  const awaitingPayment = order?.paymentStatus === 'awaiting' && order?.status === 'pending'

  return (
    <StoreLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-medium text-link hover:text-highlight">
          <ArrowLeftOutlined />
          My orders
        </Link>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-line bg-surface shadow-card p-6">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : loadError ? (
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-line bg-surface shadow-card p-10 text-center">
            <h1 className="text-lg font-semibold text-ink">Order unavailable</h1>
            <p className="mt-1 text-sm text-subtle">{loadError}</p>
            <Link to="/orders">
              <Button type="primary" className="mt-6">Back to my orders</Button>
            </Link>
          </div>
        ) : (
          <>
            {justPlaced && order.paymentMethod === 'cod' && (
              <Alert
                type="success"
                showIcon
                className="mt-6"
                title="Thank you! Your order has been placed."
                description={
                  siblings.length > 0
                    ? `Your items come from ${siblings.length + 1} shops, so they arrive in ${siblings.length + 1} parcels. You pay in cash for each one when it is delivered.`
                    : 'You will pay in cash when it is delivered. You can follow its progress on this page.'
                }
              />
            )}

            {/* Back from Stripe and the server confirmed the payment. */}
            {paymentReturn === 'success' && order.paymentStatus === 'paid' && (
              <Alert
                type="success"
                showIcon
                className="mt-6"
                title="Payment received — thank you!"
                description={
                  siblings.length > 0
                    ? `Your items come from ${siblings.length + 1} shops, so they arrive in ${siblings.length + 1} parcels. We've emailed you a confirmation.`
                    : "We've emailed you a confirmation. You can follow your order's progress on this page."
                }
              />
            )}

            {/* Card order not paid yet: explain, and offer to pay. */}
            {awaitingPayment && isOwner && (
              <Alert
                type="warning"
                showIcon
                className="mt-6"
                title={paymentReturn === 'success' ? "We're still confirming your payment" : 'This order is waiting for payment'}
                description={
                  paymentReturn === 'success'
                    ? 'Stripe is still processing it. Refresh this page in a moment.'
                    : 'Your items are reserved for a short time. Pay now to confirm the order, or cancel it.'
                }
                action={
                  <Button type="primary" size="small" loading={paying} onClick={handlePayNow}>
                    Pay now
                  </Button>
                }
              />
            )}

            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink">Order {order.orderNumber}</h1>
                <p className="mt-1 text-sm text-subtle">
                  Placed on {formatDate(order.createdAt)}
                  {order.shopName && (
                    <>
                      {' · Sold by '}
                      <span className="font-medium text-ink">{order.shopName}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusTag status={order.status} />
                {order.paymentMethod === 'card' && <PaymentStatusTag status={order.paymentStatus} />}
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

            {/* The rest of the same purchase: other shops' parcels. */}
            {siblings.length > 0 && (
              <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-card">
                <p className="text-sm text-subtle">
                  This purchase ({order.checkoutId}) arrives in {siblings.length + 1} parcels. The other{' '}
                  {siblings.length === 1 ? 'parcel' : 'parcels'}:
                </p>
                <ul className="mt-3 divide-y divide-line">
                  {siblings.map((sibling) => (
                    <li key={sibling._id}>
                      <Link
                        to={`/orders/${sibling._id}`}
                        className="flex flex-wrap items-center justify-between gap-3 py-2 hover:text-highlight"
                      >
                        <span className="text-sm">
                          <span className="font-medium text-ink">{sibling.orderNumber}</span>
                          <span className="text-subtle"> · {sibling.shopName}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="text-sm font-medium text-ink">{formatPrice(sibling.total)}</span>
                          {sibling.paymentStatus && sibling.paymentStatus !== 'cod' && <PaymentStatusTag status={sibling.paymentStatus} />}
                          <OrderStatusTag status={sibling.status} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-line bg-surface shadow-card p-6">
              {order.status === 'cancelled' ? (
                <p className="text-sm text-subtle">{cancelledMessage(order)}</p>
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
              <div className="rounded-2xl border border-line bg-surface shadow-card lg:col-span-2">
                <h2 className="border-b border-line px-6 py-4 font-semibold text-ink">
                  Items ({order.itemCount})
                </h2>
                <ul className="divide-y divide-line">
                  {order.items.map((item) => (
                    <li key={item.product} className="flex items-center gap-4 px-6 py-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line">
                        <ProductImage src={item.image} alt={item.name} className="h-full w-full" compact />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink">{item.name}</p>
                        <p className="text-sm text-subtle">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold text-ink">{formatPrice(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-line bg-surface shadow-card p-6">
                  <h2 className="font-semibold text-ink">Delivery address</h2>
                  <address className="mt-3 space-y-1 text-sm not-italic text-subtle">
                    <p className="font-medium text-ink">{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.addressLine}</p>
                    <p>
                      {order.shippingAddress.city}
                      {order.shippingAddress.postalCode && `, ${order.shippingAddress.postalCode}`}
                    </p>
                    <p>{order.shippingAddress.phone}</p>
                    {order.shippingAddress.notes && <p className="pt-2 italic">“{order.shippingAddress.notes}”</p>}
                  </address>
                </div>

                <div className="rounded-2xl border border-line bg-surface shadow-card p-6">
                  <h2 className="font-semibold text-ink">Payment summary</h2>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-subtle">Subtotal</dt>
                      <dd className="font-medium text-ink">{formatPrice(order.subtotal)}</dd>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-success">Discount ({order.coupon?.code || 'coupon'})</dt>
                        <dd className="font-medium text-success">−{formatPrice(order.discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-subtle">Shipping</dt>
                      <dd className="font-medium text-success">Free</dd>
                    </div>
                    <div className="flex justify-between border-t border-line pt-3 text-base">
                      <dt className="font-semibold text-ink">Total</dt>
                      <dd className="font-bold text-ink">{formatPrice(order.total)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-subtle">Payment</dt>
                      <dd className="font-medium text-ink">
                        {order.paymentMethod === 'card' ? <PaymentStatusTag status={order.paymentStatus} /> : 'Cash on delivery'}
                      </dd>
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
