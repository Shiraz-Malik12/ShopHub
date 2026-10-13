import { useEffect, useState } from 'react'
import { Alert, Button, Empty, Skeleton, Tooltip } from 'antd'
import { RightOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import OrderStatusTag from '../../components/OrderStatusTag'
import ProductImage from '../../components/ProductImage'
import * as dashboardApi from '../../api/dashboardApi'
import { formatDate } from '../../utils/formatDate'
import { formatPrice } from '../../utils/formatPrice'
import { ORDER_STATUS } from '../../utils/orderStatus'

const numberFormatter = new Intl.NumberFormat('en-US')

// A small headline number: plain label on top, the value below it.
function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

function Panel({ title, action, children }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <h2 className="font-semibold text-slate-100">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function PanelLink({ to, children }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-300">
      {children}
      <RightOutlined className="text-[10px]" />
    </Link>
  )
}

// Admin home: how the store is doing at a glance. All numbers come from
// GET /api/admin/dashboard — this page only displays them.
export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  async function loadDashboard() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data } = await dashboardApi.fetchDashboard()
      setDashboard(data)
    } catch (err) {
      setLoadError(err?.response?.data?.message || 'Could not load the dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  if (loading || loadError) {
    return (
      <AdminLayout>
        <PageHeader title="Dashboard" description="A quick look at how your store is doing." />
        {loadError ? (
          <Alert
            type="error"
            showIcon
            title="Could not load the dashboard"
            description={loadError}
            action={<Button size="small" onClick={loadDashboard}>Retry</Button>}
          />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        )}
      </AdminLayout>
    )
  }

  const { stats, ordersByStatus, recentOrders, lowStockProducts, lowStockThreshold } = dashboard
  // The longest bar belongs to the status with the most orders.
  const largestStatusCount = Math.max(1, ...Object.values(ordersByStatus))

  return (
    <AdminLayout>
      <PageHeader title="Dashboard" description="A quick look at how your store is doing." />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* The one headline number of the page. */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <p className="text-sm text-slate-400">Total sales</p>
            <p className="mt-3 text-5xl font-semibold tracking-tight text-slate-100">{formatPrice(stats.totalSales)}</p>
          </div>
          <p className="mt-4 text-xs text-slate-500">All orders except cancelled ones.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatTile label="Total orders" value={numberFormatter.format(stats.totalOrders)} />
          <StatTile
            label="Pending orders"
            value={numberFormatter.format(stats.pendingOrders)}
            hint={stats.pendingOrders > 0 ? 'Waiting for you to start on them' : 'Nothing waiting'}
          />
          <StatTile label="Active products" value={numberFormatter.format(stats.activeProducts)} />
          <StatTile label="Customers" value={numberFormatter.format(stats.customers)} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Orders by status" action={<PanelLink to="/admin/orders">All orders</PanelLink>}>
          {stats.totalOrders === 0 ? (
            <div className="py-10">
              <Empty description="No orders yet" />
            </div>
          ) : (
            <ul className="space-y-4 p-5">
              {Object.entries(ordersByStatus).map(([status, count]) => (
                <li key={status} className="flex items-center gap-3">
                  {/* The label names the status; the bar only shows how many. */}
                  <span className="w-28 shrink-0">
                    <OrderStatusTag status={status} />
                  </span>
                  <Tooltip
                    title={`${ORDER_STATUS[status].label}: ${count} of ${stats.totalOrders} orders (${Math.round((count / stats.totalOrders) * 100)}%)`}
                  >
                    <div className="h-6 flex-1 py-2" role="img" aria-label={`${ORDER_STATUS[status].label}: ${count} orders`}>
                      <div className="h-2 rounded-r bg-indigo-500" style={{ width: `${(count / largestStatusCount) * 100}%` }} />
                    </div>
                  </Tooltip>
                  <span className="w-8 shrink-0 text-right text-sm font-medium text-slate-100">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Low stock" action={<PanelLink to="/admin/products">All products</PanelLink>}>
          {lowStockProducts.length === 0 ? (
            <div className="py-10">
              <Empty description={`Every product has more than ${lowStockThreshold} in stock`} />
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {lowStockProducts.map((product) => (
                <li key={product._id} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-800">
                    <ProductImage src={product.image} alt={product.name} className="h-full w-full" compact />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-100">{product.name}</p>
                    <p className="text-xs text-slate-400">{product.category || 'Uncategorized'}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      product.stock === 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Recent orders" action={<PanelLink to="/admin/orders">Manage orders</PanelLink>}>
          {recentOrders.length === 0 ? (
            <div className="py-10">
              <Empty description="No orders yet" />
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {recentOrders.map((order) => (
                <li key={order._id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-100">{order.orderNumber}</p>
                    <p className="truncate text-xs text-slate-400">
                      {order.user?.name || 'Deleted user'} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <OrderStatusTag status={order.status} />
                  <span className="w-24 text-right text-sm font-semibold text-slate-100">{formatPrice(order.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AdminLayout>
  )
}
