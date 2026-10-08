import { useState } from 'react'
import { Alert, App as AntdApp, Button, Form, Input, Skeleton } from 'antd'
import { ArrowLeftOutlined, DollarOutlined, LockOutlined } from '@ant-design/icons'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import StoreLayout from '../components/layout/StoreLayout'
import ProductImage from '../components/ProductImage'
import * as orderApi from '../api/orderApi'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/formatPrice'

// Step between the cart and an order: the customer gives a delivery
// address and confirms. Only the address is sent — the server builds the
// order from the cart it already has, with prices from the database.
export default function CheckoutPage() {
  const { user } = useAuth()
  const { cart, loading, refresh } = useCart()
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const [placing, setPlacing] = useState(false)
  // Once the order is placed the cart becomes empty; this flag stops the
  // "empty cart → back to /cart" redirect below from firing in that moment.
  const [orderPlaced, setOrderPlaced] = useState(false)

  const hasUnavailableItems = cart.items.some((item) => !item.available)

  async function handlePlaceOrder(values) {
    setPlacing(true)
    try {
      const { data } = await orderApi.placeOrder(values)
      setOrderPlaced(true)
      await refresh().catch(() => {}) // the server emptied the cart — reload it
      navigate(`/orders/${data.order._id}`, { replace: true, state: { justPlaced: true } })
    } catch (err) {
      message.error(err?.response?.data?.message || 'Could not place your order. Please try again.')
      // Stock or availability may have changed — show the cart as it is now.
      refresh().catch(() => {})
    } finally {
      setPlacing(false)
    }
  }

  if (!loading && cart.items.length === 0 && !orderPlaced) {
    return <Navigate to="/cart" replace />
  }

  return (
    <StoreLayout>
      <section className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Checkout</h1>
          <p className="mt-2 text-slate-400">Tell us where to deliver your order.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-lg font-semibold text-slate-100">Delivery address</h2>
                <Form
                  id="checkout-form"
                  layout="vertical"
                  requiredMark={false}
                  className="mt-4"
                  initialValues={{ fullName: user?.name }}
                  onFinish={handlePlaceOrder}
                >
                  <div className="grid gap-x-4 sm:grid-cols-2">
                    <Form.Item
                      name="fullName"
                      label="Full name"
                      rules={[
                        { required: true, message: 'Please enter your full name' },
                        { min: 2, max: 80, message: 'Full name must be between 2 and 80 characters' },
                      ]}
                    >
                      <Input size="large" autoComplete="name" />
                    </Form.Item>
                    <Form.Item
                      name="phone"
                      label="Phone number"
                      rules={[
                        { required: true, message: 'Please enter your phone number' },
                        { pattern: /^\+?[0-9][0-9\s-]{6,18}$/, message: 'Enter a valid phone number' },
                      ]}
                    >
                      <Input size="large" placeholder="e.g. 0300 1234567" autoComplete="tel" />
                    </Form.Item>
                  </div>
                  <Form.Item
                    name="addressLine"
                    label="Address"
                    rules={[
                      { required: true, message: 'Please enter your address' },
                      { min: 5, max: 200, message: 'Address must be between 5 and 200 characters' },
                    ]}
                  >
                    <Input.TextArea rows={2} placeholder="House / street / area" autoComplete="street-address" />
                  </Form.Item>
                  <div className="grid gap-x-4 sm:grid-cols-2">
                    <Form.Item
                      name="city"
                      label="City"
                      rules={[
                        { required: true, message: 'Please enter your city' },
                        { min: 2, max: 80, message: 'City must be between 2 and 80 characters' },
                      ]}
                    >
                      <Input size="large" autoComplete="address-level2" />
                    </Form.Item>
                    <Form.Item name="postalCode" label="Postal code (optional)" rules={[{ max: 20 }]}>
                      <Input size="large" autoComplete="postal-code" />
                    </Form.Item>
                  </div>
                  <Form.Item name="notes" label="Delivery notes (optional)" rules={[{ max: 500 }]} className="mb-0">
                    <Input.TextArea rows={2} placeholder="Anything the courier should know" />
                  </Form.Item>
                </Form>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-lg font-semibold text-slate-100">Payment</h2>
                <div className="mt-4 flex items-center gap-4 rounded-lg border border-indigo-500/40 bg-indigo-500/10 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-lg text-indigo-300">
                    <DollarOutlined />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-100">Cash on delivery</p>
                    <p className="text-sm text-slate-400">Pay in cash when your order arrives.</p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold text-slate-100">Order summary</h2>
              <ul className="mt-4 space-y-4">
                {cart.items.map((item) => (
                  <li key={item.product._id} className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-800">
                      <ProductImage src={item.product.image} alt={item.product.name} className="h-full w-full" compact />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-100">{item.product.name}</p>
                      <p className="text-xs text-slate-400">
                        {item.available ? `Qty ${item.quantity}` : 'Unavailable'}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${item.available ? 'text-slate-100' : 'text-slate-500 line-through'}`}>
                      {formatPrice(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-6 space-y-3 border-t border-slate-800 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Subtotal</dt>
                  <dd className="font-medium text-slate-100">{formatPrice(cart.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Shipping</dt>
                  <dd className="font-medium text-emerald-400">Free</dd>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-3 text-base">
                  <dt className="font-semibold text-slate-100">Total</dt>
                  <dd className="font-bold text-slate-100">{formatPrice(cart.subtotal)}</dd>
                </div>
              </dl>

              {hasUnavailableItems && (
                <Alert
                  type="warning"
                  showIcon
                  className="mt-4"
                  title="Some items are unavailable"
                  description="Remove them from your cart to continue."
                />
              )}

              <Button
                type="primary"
                size="large"
                block
                htmlType="submit"
                form="checkout-form"
                icon={<LockOutlined />}
                loading={placing}
                disabled={hasUnavailableItems}
                className="mt-6"
              >
                Place order
              </Button>

              <Link to="/cart" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300">
                <ArrowLeftOutlined />
                Back to cart
              </Link>
            </aside>
          </div>
        )}
      </div>
    </StoreLayout>
  )
}
