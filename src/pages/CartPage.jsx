import { useState } from 'react'
import { App as AntdApp, Button, Empty, Popconfirm, Skeleton, Tag, Tooltip } from 'antd'
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import StoreLayout from '../components/layout/StoreLayout'
import ProductImage from '../components/ProductImage'
import QuantityStepper from '../components/QuantityStepper'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/formatPrice'

// The signed-in customer's cart. All data and actions come from
// CartContext — this page only displays the cart and calls those actions.
export default function CartPage() {
  const { cart, loading, updateQuantity, removeItem, clear } = useCart()
  const { message } = AntdApp.useApp()
  // Id of the product whose row is waiting on the server, so only that
  // row's controls are disabled while it updates.
  const [busyProductId, setBusyProductId] = useState(null)
  const [clearing, setClearing] = useState(false)

  async function runItemAction(productId, action) {
    setBusyProductId(productId)
    try {
      await action()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusyProductId(null)
    }
  }

  async function handleClear() {
    setClearing(true)
    try {
      await clear()
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setClearing(false)
    }
  }

  const isEmpty = cart.items.length === 0

  return (
    <StoreLayout>
      <section className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Shopping cart</h1>
          <p className="mt-2 text-slate-400">
            {isEmpty ? 'Your cart is empty.' : `${cart.itemCount} ${cart.itemCount === 1 ? 'item' : 'items'} in your cart`}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading && isEmpty ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </div>
        ) : isEmpty ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 py-16">
            <Empty description="Your cart is empty.">
              <Link to="/products">
                <Button type="primary">Start shopping</Button>
              </Link>
            </Empty>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900 lg:col-span-2">
              {cart.items.map((item) => {
                const { product } = item
                const busy = busyProductId === product._id
                return (
                  <li key={product._id} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                    <Link
                      to={`/products/${product._id}`}
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-800 sm:h-24 sm:w-24"
                    >
                      <ProductImage src={product.image} alt={product.name} className="h-full w-full" compact />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <Link
                          to={`/products/${product._id}`}
                          className="line-clamp-2 font-semibold text-slate-100 hover:text-indigo-400"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-sm text-slate-400">
                          {product.category?.name || 'Uncategorized'} · {formatPrice(product.price)} each
                        </p>
                        {!item.available && (
                          <Tag color="error" className="mt-2">
                            {product.stock === 0 ? 'Out of stock' : 'No longer available'}
                          </Tag>
                        )}
                      </div>

                      {/* On phones this row may wrap instead of pushing the page
                          wider than the screen; from sm up it stays on one line. */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:shrink-0 sm:flex-nowrap sm:gap-x-4">
                        {item.available && (
                          <QuantityStepper
                            value={item.quantity}
                            max={Math.min(product.stock, 99)}
                            disabled={busy}
                            onChange={(quantity) => runItemAction(product._id, () => updateQuantity(product._id, quantity))}
                          />
                        )}
                        <span className={`font-semibold sm:w-24 sm:text-right ${item.available ? 'text-slate-100' : 'text-slate-500 line-through'}`}>
                          {formatPrice(item.lineTotal)}
                        </span>
                        <Tooltip title="Remove">
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            aria-label={`Remove ${product.name}`}
                            loading={busy}
                            onClick={() => runItemAction(product._id, () => removeItem(product._id))}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <aside className="h-fit rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold text-slate-100">Order summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Items</dt>
                  <dd className="font-medium text-slate-100">{cart.itemCount}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-3 text-base">
                  <dt className="font-semibold text-slate-100">Subtotal</dt>
                  <dd className="font-bold text-slate-100">{formatPrice(cart.subtotal)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-slate-500">Shipping and taxes are calculated at checkout.</p>

              <Tooltip title="Checkout is coming soon">
                <Button type="primary" size="large" block disabled className="mt-6">
                  Checkout
                </Button>
              </Tooltip>

              <div className="mt-4 flex items-center justify-between text-sm">
                <Link to="/products" className="inline-flex items-center gap-2 font-medium text-indigo-400 hover:text-indigo-300">
                  <ArrowLeftOutlined />
                  Continue shopping
                </Link>
                <Popconfirm title="Remove all items from your cart?" okText="Clear cart" onConfirm={handleClear}>
                  <Button type="link" danger loading={clearing} className="px-0">
                    Clear cart
                  </Button>
                </Popconfirm>
              </div>
            </aside>
          </div>
        )}
      </div>
    </StoreLayout>
  )
}
