import { useEffect, useState } from 'react'
import { Alert, App as AntdApp, Button, Empty, Popconfirm, Select, Space, Table } from 'antd'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import OrderStatusTag from '../../components/OrderStatusTag'
import ProductImage from '../../components/ProductImage'
import * as orderApi from '../../api/orderApi'
import { formatDate } from '../../utils/formatDate'
import { formatPrice } from '../../utils/formatPrice'
import { NEXT_STATUSES, ORDER_STATUS } from '../../utils/orderStatus'

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All orders' },
  ...Object.entries(ORDER_STATUS).map(([value, { label }]) => ({ value, label })),
]

// Admin-only: every customer's orders, with the buttons to move each one
// along (Pending → Processing → Shipped → Delivered) or cancel it. The
// server decides which moves are allowed; NEXT_STATUSES only picks buttons.
export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [updatingId, setUpdatingId] = useState(null)
  const { message } = AntdApp.useApp()

  useEffect(() => {
    // `ignore`: if the filter changes again before this request finishes,
    // its outdated answer is thrown away.
    let ignore = false

    async function loadOrders() {
      setLoading(true)
      setLoadError(null)
      try {
        const { data } = await orderApi.fetchAllOrdersAdmin(statusFilter ? { status: statusFilter } : undefined)
        if (!ignore) setOrders(data.orders)
      } catch (err) {
        if (!ignore) setLoadError(err?.response?.data?.message || 'Could not load orders.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadOrders()
    return () => {
      ignore = true
    }
  }, [statusFilter, reloadKey])

  async function handleStatusChange(order, status) {
    setUpdatingId(order._id)
    try {
      const { data } = await orderApi.updateOrderStatus(order._id, status)
      setOrders((previous) =>
        previous
          .map((item) => (item._id === data.order._id ? data.order : item))
          // With a status filter on, an order that no longer matches leaves the list.
          .filter((item) => !statusFilter || item.status === statusFilter),
      )
      message.success(`Order ${order.orderNumber} is now ${ORDER_STATUS[status].label.toLowerCase()}`)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  const columns = [
    {
      title: 'Order',
      key: 'order',
      render: (_, order) => (
        <div>
          <div className="font-medium text-slate-100">{order.orderNumber}</div>
          <div className="text-xs text-slate-400">{formatDate(order.createdAt)}</div>
        </div>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, order) => (
        <div className="min-w-0">
          <div className="truncate text-slate-100">{order.user?.name || 'Deleted user'}</div>
          <div className="truncate text-xs text-slate-400">{order.user?.email}</div>
        </div>
      ),
    },
    { title: 'Items', dataIndex: 'itemCount', key: 'itemCount' },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total) => <span className="font-medium">{formatPrice(total)}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <OrderStatusTag status={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, order) => {
        const nextStatuses = NEXT_STATUSES[order.status]
        if (nextStatuses.length === 0) return <span className="text-xs text-slate-500">No actions</span>
        return (
          <Space>
            {nextStatuses.map((status) =>
              status === 'cancelled' ? (
                <Popconfirm
                  key={status}
                  title="Cancel this order?"
                  description="The items go back into stock."
                  okText="Cancel order"
                  cancelText="Keep it"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleStatusChange(order, status)}
                >
                  <Button size="small" danger disabled={updatingId === order._id}>
                    Cancel
                  </Button>
                </Popconfirm>
              ) : (
                <Button
                  key={status}
                  size="small"
                  type="primary"
                  loading={updatingId === order._id}
                  onClick={() => handleStatusChange(order, status)}
                >
                  Mark {ORDER_STATUS[status].label.toLowerCase()}
                </Button>
              ),
            )}
          </Space>
        )
      },
    },
  ]

  // Shown when a row is expanded: what to pack and where to send it.
  function renderOrderDetails(order) {
    const address = order.shippingAddress
    return (
      <div className="grid gap-6 py-2 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Items</p>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.product} className="flex items-center gap-3 text-sm">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-slate-800">
                  <ProductImage src={item.image} alt={item.name} className="h-full w-full" compact />
                </div>
                <span className="min-w-0 flex-1 truncate text-slate-100">{item.name}</span>
                <span className="text-slate-400">
                  {formatPrice(item.price)} × {item.quantity}
                </span>
                <span className="w-24 text-right font-medium text-slate-100">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Deliver to</p>
          <address className="space-y-1 text-sm not-italic text-slate-400">
            <p className="font-medium text-slate-100">{address.fullName}</p>
            <p>{address.addressLine}</p>
            <p>
              {address.city}
              {address.postalCode && `, ${address.postalCode}`}
            </p>
            <p>{address.phone}</p>
            {address.notes && <p className="pt-1 italic">“{address.notes}”</p>}
          </address>
          <p className="mt-3 text-sm text-slate-400">
            Payment: <span className="text-slate-100">Cash on delivery</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Orders"
        description="See what customers ordered and move each order through delivery."
        actions={
          <Select
            aria-label="Filter orders by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTER_OPTIONS}
            className="w-44"
          />
        }
      />

      {loadError ? (
        <Alert
          type="error"
          showIcon
          title="Could not load orders"
          description={loadError}
          action={<Button size="small" onClick={() => setReloadKey((key) => key + 1)}>Retry</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={orders}
            loading={loading}
            pagination={false}
            scroll={{ x: 820 }}
            expandable={{ expandedRowRender: renderOrderDetails }}
            locale={{ emptyText: <Empty description={loading ? 'Loading orders...' : 'No orders yet'} /> }}
          />
        </div>
      )}
    </AdminLayout>
  )
}
