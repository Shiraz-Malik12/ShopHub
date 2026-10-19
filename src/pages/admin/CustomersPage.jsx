import { useEffect, useState } from 'react'
import { Alert, App as AntdApp, Button, Drawer, Empty, Input, Popconfirm, Select, Skeleton, Table, Tag } from 'antd'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import OrderStatusTag from '../../components/OrderStatusTag'
import * as customerApi from '../../api/customerApi'
import { formatDate } from '../../utils/formatDate'
import { formatPrice } from '../../utils/formatPrice'

const PAGE_SIZE = 10

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All customers' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
]

function CustomerStatusTag({ customer }) {
  return customer.isBlocked ? <Tag color="red">Blocked</Tag> : <Tag color="green">Active</Tag>
}

// Block / Unblock button. Blocking asks first, because it signs the
// customer out everywhere; unblocking is harmless, so it doesn't.
function BlockButton({ customer, busy, onChange }) {
  if (customer.isBlocked) {
    return (
      <Button size="small" loading={busy} onClick={() => onChange(customer, false)}>
        Unblock
      </Button>
    )
  }
  return (
    <Popconfirm
      title={`Block ${customer.name}?`}
      description="They are signed out right away and can't log in or order until you unblock them."
      okText="Block"
      cancelText="Keep active"
      okButtonProps={{ danger: true }}
      onConfirm={() => onChange(customer, true)}
    >
      <Button size="small" danger loading={busy}>
        Block
      </Button>
    </Popconfirm>
  )
}

function InfoRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="flex items-center justify-end gap-1 text-right text-slate-100">{children}</span>
    </div>
  )
}

// Side panel with one customer's details and order history.
function CustomerDrawer({ customerId, onClose, busyId, onBlockChange, reloadKey }) {
  const [details, setDetails] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    if (!customerId) return undefined
    let ignore = false
    setLoadError(null)
    customerApi
      .fetchCustomer(customerId)
      .then(({ data }) => !ignore && setDetails(data))
      .catch((err) => !ignore && setLoadError(err?.response?.data?.message || 'Could not load this customer.'))
    return () => {
      ignore = true
    }
  }, [customerId, reloadKey])

  // Old details stay in state until the new ones arrive; only show them
  // if they belong to the customer that is open now.
  const current = details?.customer.id === customerId ? details : null
  const customer = current?.customer
  const address = customer?.savedAddress

  return (
    <Drawer
      open={Boolean(customerId)}
      onClose={onClose}
      title={customer?.name || 'Customer'}
      size={Math.min(520, window.innerWidth)}
      extra={customer && <BlockButton customer={customer} busy={busyId === customer.id} onChange={onBlockChange} />}
    >
      {loadError ? (
        <Alert type="error" showIcon title="Could not load this customer" description={loadError} />
      ) : !current ? (
        <Skeleton active />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-400">Orders</p>
              <p className="mt-1 text-xl font-semibold text-slate-100">{customer.orderCount}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-400">Total spent</p>
              <p className="mt-1 text-xl font-semibold text-slate-100">{formatPrice(customer.totalSpent)}</p>
            </div>
          </div>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
            <InfoRow label="Email">{customer.email}</InfoRow>
            <InfoRow label="Joined">{formatDate(customer.createdAt)}</InfoRow>
            <InfoRow label="Email verified">{customer.isVerified ? 'Yes' : 'No'}</InfoRow>
            <InfoRow label="Status">
              <CustomerStatusTag customer={customer} />
              {customer.blockedAt && <span className="text-xs text-slate-400">since {formatDate(customer.blockedAt)}</span>}
            </InfoRow>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Saved address</p>
            {address ? (
              <address className="space-y-0.5 text-sm not-italic text-slate-400">
                <p className="font-medium text-slate-100">{address.fullName}</p>
                <p>{address.addressLine}</p>
                <p>
                  {address.city}
                  {address.postalCode && `, ${address.postalCode}`}
                </p>
                <p>{address.phone}</p>
              </address>
            ) : (
              <p className="text-sm text-slate-500">No saved address.</p>
            )}
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Orders</p>
            {current.orders.length === 0 ? (
              <p className="text-sm text-slate-500">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
                {current.orders.map((order) => (
                  <li key={order._id}>
                    <Link
                      to={`/orders/${order._id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-800/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">{order.orderNumber}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-medium text-slate-100">{formatPrice(order.total)}</span>
                        <OrderStatusTag status={order.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Drawer>
  )
}

// Admin-only: everyone who has signed up as a customer, how much they've
// ordered, and a Block button for accounts that misuse the shop.
export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [openCustomerId, setOpenCustomerId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const { message } = AntdApp.useApp()

  useEffect(() => {
    let ignore = false

    async function loadCustomers() {
      setLoading(true)
      setLoadError(null)
      try {
        const params = { page, limit: PAGE_SIZE }
        if (search) params.search = search
        if (statusFilter) params.status = statusFilter
        const { data } = await customerApi.fetchCustomers(params)
        if (!ignore) {
          setCustomers(data.customers)
          setPagination(data.pagination)
        }
      } catch (err) {
        if (!ignore) setLoadError(err?.response?.data?.message || 'Could not load customers.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadCustomers()
    return () => {
      ignore = true
    }
  }, [page, search, statusFilter, reloadKey])

  // A new search or filter always starts again from page 1.
  function handleSearch(value) {
    setSearch(value.trim())
    setPage(1)
  }

  function handleStatusFilter(value) {
    setStatusFilter(value)
    setPage(1)
  }

  async function handleBlockChange(customer, blocked) {
    setBusyId(customer.id)
    try {
      await customerApi.setCustomerBlocked(customer.id, blocked)
      message.success(`${customer.name} is now ${blocked ? 'blocked' : 'active'}`)
      // Reload the list (and the open drawer) so tags, filters and dates match the server.
      setReloadKey((key) => key + 1)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_, customer) => (
        <button type="button" onClick={() => setOpenCustomerId(customer.id)} className="min-w-0 text-left">
          <div className="truncate font-medium text-slate-100 hover:text-indigo-300">{customer.name}</div>
          <div className="truncate text-xs text-slate-400">{customer.email}</div>
        </button>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => <span className="text-slate-400">{formatDate(value)}</span>,
    },
    { title: 'Orders', dataIndex: 'orderCount', key: 'orderCount' },
    {
      title: 'Total spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (value) => <span className="font-medium">{formatPrice(value)}</span>,
    },
    {
      title: 'Last order',
      dataIndex: 'lastOrderAt',
      key: 'lastOrderAt',
      render: (value) => <span className="text-slate-400">{value ? formatDate(value) : '—'}</span>,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, customer) => (
        <div className="flex flex-wrap gap-1">
          <CustomerStatusTag customer={customer} />
          {!customer.isVerified && <Tag>Unverified</Tag>}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, customer) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => setOpenCustomerId(customer.id)}>
            View
          </Button>
          <BlockButton customer={customer} busy={busyId === customer.id} onChange={handleBlockChange} />
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <PageHeader
        title="Customers"
        description="Everyone who has signed up, what they've ordered, and who is blocked."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Input.Search
              aria-label="Search customers"
              placeholder="Search name or email"
              allowClear
              onSearch={handleSearch}
              className="sm:w-64"
            />
            <Select
              aria-label="Filter customers by status"
              value={statusFilter}
              onChange={handleStatusFilter}
              options={STATUS_FILTER_OPTIONS}
              className="sm:w-40"
            />
          </div>
        }
      />

      {loadError ? (
        <Alert
          type="error"
          showIcon
          title="Could not load customers"
          description={loadError}
          action={<Button size="small" onClick={() => setReloadKey((key) => key + 1)}>Retry</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={customers}
            loading={loading}
            scroll={{ x: 860 }}
            pagination={{
              current: pagination.page,
              pageSize: PAGE_SIZE,
              total: pagination.total,
              showSizeChanger: false,
              hideOnSinglePage: true,
              onChange: setPage,
              className: 'px-4',
            }}
            locale={{
              emptyText: (
                <Empty description={loading ? 'Loading customers...' : search || statusFilter ? 'No customers match' : 'No customers yet'} />
              ),
            }}
          />
        </div>
      )}

      <CustomerDrawer
        customerId={openCustomerId}
        onClose={() => setOpenCustomerId(null)}
        busyId={busyId}
        onBlockChange={handleBlockChange}
        reloadKey={reloadKey}
      />
    </AdminLayout>
  )
}
