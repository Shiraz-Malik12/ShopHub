import { useEffect, useState } from 'react'
import { Alert, App as AntdApp, Button, Empty, Form, Input, Modal, Popconfirm, Segmented, Table, Tag } from 'antd'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import ShopStatusTag from '../../components/ShopStatusTag'
import * as shopApi from '../../api/shopApi'
import { formatDate } from '../../utils/formatDate'

const PAGE_SIZE = 10

const STATUS_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
  { value: '', label: 'All' },
]

// Wording for the "why?" box, which opens for bad news only.
const REASON_COPY = {
  rejected: {
    title: (name) => `Reject ${name}?`,
    okText: 'Reject',
    help: 'The owner sees this and can fix their details and send it again.',
    placeholder: 'Please add a real phone number so customers can reach you.',
  },
  suspended: {
    title: (name) => `Suspend ${name}?`,
    okText: 'Suspend',
    help: 'The owner sees this. Their shop stops selling until you reinstate it.',
    placeholder: 'Several customers reported orders that never arrived.',
  },
}

// Asks the admin why a shop is being rejected or suspended.
function ReasonModal({ target, busy, onConfirm, onClose }) {
  const [form] = Form.useForm()
  const copy = target ? REASON_COPY[target.status] : null

  return (
    <Modal
      open={Boolean(target)}
      title={copy?.title(target.shop.name)}
      okText={copy?.okText}
      okButtonProps={{ danger: true, loading: busy }}
      cancelText="Cancel"
      onOk={() => form.submit()}
      onCancel={onClose}
      // Throws the typed reason away on close, so the next shop starts empty.
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={({ reason }) => onConfirm(reason)}>
        <Form.Item
          name="reason"
          label="Reason"
          extra={copy?.help}
          rules={[
            { required: true, whitespace: true, message: 'Please give a reason' },
            { min: 5, max: 300, message: 'Reason must be between 5 and 300 characters' },
          ]}
        >
          <Input.TextArea rows={3} maxLength={300} showCount placeholder={copy?.placeholder} autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// The buttons for one shop. Which ones show depends on its status — the
// same moves the server allows (see NEXT_SHOP_STATUSES in Shop.js).
function ShopActions({ shop, busy, onApprove, onAskReason }) {
  if (shop.status === 'pending') {
    return (
      <div className="flex gap-2">
        <Popconfirm
          title={`Approve ${shop.name}?`}
          description="The owner becomes a seller and gets an email."
          okText="Approve"
          cancelText="Not yet"
          onConfirm={() => onApprove(shop)}
        >
          <Button size="small" type="primary" loading={busy}>
            Approve
          </Button>
        </Popconfirm>
        <Button size="small" danger disabled={busy} onClick={() => onAskReason(shop, 'rejected')}>
          Reject
        </Button>
      </div>
    )
  }
  if (shop.status === 'approved') {
    return (
      <Button size="small" danger loading={busy} onClick={() => onAskReason(shop, 'suspended')}>
        Suspend
      </Button>
    )
  }
  if (shop.status === 'suspended') {
    return (
      <Popconfirm
        title={`Reinstate ${shop.name}?`}
        description="The shop is approved again and the owner is a seller again."
        okText="Reinstate"
        cancelText="Keep suspended"
        onConfirm={() => onApprove(shop)}
      >
        <Button size="small" loading={busy}>
          Reinstate
        </Button>
      </Popconfirm>
    )
  }
  return <span className="text-xs text-faint">Waiting for the owner to resubmit</span>
}

// Extra details under a row: what they sell, and the last decision.
function ShopExtraDetails({ shop }) {
  return (
    <div className="space-y-2 py-1 text-sm">
      <p>
        <span className="text-subtle">What they sell: </span>
        <span className="text-ink">{shop.description || 'Not added'}</span>
      </p>
      {shop.statusReason && (
        <p>
          <span className="text-subtle">Reason given: </span>
          <span className="text-ink">{shop.statusReason}</span>
        </p>
      )}
      {shop.reviewedAt && <p className="text-subtle">Last reviewed {formatDate(shop.reviewedAt)}</p>}
    </div>
  )
}

// Admin-only: everyone who applied to sell on ShopHub. New applications
// wait under "Pending" until the admin approves or rejects them.
export default function ShopsPage() {
  const [shops, setShops] = useState([])
  const [counts, setCounts] = useState({})
  const [pagination, setPagination] = useState({ page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyId, setBusyId] = useState(null)
  // { shop, status } while the "why?" box is open.
  const [reasonTarget, setReasonTarget] = useState(null)
  const { message } = AntdApp.useApp()

  useEffect(() => {
    let ignore = false

    async function loadShops() {
      setLoading(true)
      setLoadError(null)
      try {
        const params = { page, limit: PAGE_SIZE }
        if (statusFilter) params.status = statusFilter
        if (search) params.search = search
        const { data } = await shopApi.fetchShops(params)
        if (!ignore) {
          setShops(data.shops)
          setCounts(data.counts)
          setPagination(data.pagination)
        }
      } catch (err) {
        if (!ignore) setLoadError(err?.response?.data?.message || 'Could not load shops.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadShops()
    return () => {
      ignore = true
    }
  }, [page, statusFilter, search, reloadKey])

  // A new filter or search always starts again from page 1.
  function handleStatusFilter(value) {
    setStatusFilter(value)
    setPage(1)
  }

  function handleSearch(value) {
    setSearch(value.trim())
    setPage(1)
  }

  async function changeStatus(shop, status, reason) {
    setBusyId(shop.id)
    try {
      const { data } = await shopApi.setShopStatus(shop.id, status, reason)
      message.success(data.message)
      setReasonTarget(null)
      // Reload so the row moves to its new tab and the counts update.
      setReloadKey((key) => key + 1)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const tabOptions = STATUS_TABS.map((tab) => {
    const count = tab.value ? counts[tab.value] : Object.values(counts).reduce((sum, n) => sum + n, 0)
    return { value: tab.value, label: count ? `${tab.label} (${count})` : tab.label }
  })

  const columns = [
    {
      title: 'Shop',
      key: 'shop',
      render: (_, shop) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">{shop.name}</div>
          <div className="truncate text-xs text-subtle">{shop.city}</div>
        </div>
      ),
    },
    {
      title: 'Owner',
      key: 'owner',
      render: (_, shop) =>
        shop.owner ? (
          <div className="min-w-0">
            <div className="flex items-center gap-1 truncate text-ink">
              {shop.owner.name}
              {shop.owner.isBlocked && <Tag color="red">Blocked</Tag>}
            </div>
            <div className="truncate text-xs text-subtle">{shop.owner.email}</div>
          </div>
        ) : (
          <span className="text-faint">Account deleted</span>
        ),
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (value) => <span className="text-subtle">{value}</span> },
    {
      title: 'Applied',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => <span className="text-subtle">{formatDate(value)}</span>,
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (value) => <ShopStatusTag status={value} /> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, shop) => (
        <ShopActions
          shop={shop}
          busy={busyId === shop.id}
          onApprove={(target) => changeStatus(target, 'approved')}
          onAskReason={(target, status) => setReasonTarget({ shop: target, status })}
        />
      ),
    },
  ]

  return (
    <AdminLayout>
      <PageHeader
        title="Shops"
        description="People who want to sell on ShopHub. Approve new shops, or suspend ones that break the rules."
        actions={
          <Input.Search
            aria-label="Search shops"
            placeholder="Search shop, city or owner"
            allowClear
            onSearch={handleSearch}
            className="sm:w-72"
          />
        }
      />

      <div className="mb-4 overflow-x-auto">
        <Segmented value={statusFilter} onChange={handleStatusFilter} options={tabOptions} />
      </div>

      {loadError ? (
        <Alert
          type="error"
          showIcon
          title="Could not load shops"
          description={loadError}
          action={<Button size="small" onClick={() => setReloadKey((key) => key + 1)}>Retry</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={shops}
            loading={loading}
            scroll={{ x: 900 }}
            expandable={{ expandedRowRender: (shop) => <ShopExtraDetails shop={shop} /> }}
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
                <Empty
                  description={
                    loading
                      ? 'Loading shops...'
                      : search
                        ? 'No shops match'
                        : statusFilter === 'pending'
                          ? 'No applications waiting for review'
                          : 'No shops here yet'
                  }
                />
              ),
            }}
          />
        </div>
      )}

      <ReasonModal
        target={reasonTarget}
        busy={Boolean(reasonTarget) && busyId === reasonTarget.shop.id}
        onConfirm={(reason) => changeStatus(reasonTarget.shop, reasonTarget.status, reason)}
        onClose={() => setReasonTarget(null)}
      />
    </AdminLayout>
  )
}
