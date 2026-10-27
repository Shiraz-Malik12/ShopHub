import { useEffect, useState } from 'react'
import {
  Alert,
  App as AntdApp,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Table,
  Tag,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import * as couponApi from '../../api/couponApi'
import { formatDate } from '../../utils/formatDate'
import { formatPrice } from '../../utils/formatPrice'

const TYPE_OPTIONS = [
  { value: 'percent', label: 'Percent off (e.g. 10%)' },
  { value: 'fixed', label: 'Fixed amount off (e.g. $5)' },
]

function describe(coupon) {
  return coupon.type === 'percent' ? `${coupon.value}% off` : `${formatPrice(coupon.value)} off`
}

// What the admin should know at a glance: can customers use it right now?
function CouponStatusTag({ coupon }) {
  if (!coupon.isActive) return <Tag>Off</Tag>
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) return <Tag color="orange">Expired</Tag>
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return <Tag color="orange">Used up</Tag>
  return <Tag color="green">Active</Tag>
}

// <input type="date"> works with "2026-12-31" text; the server stores a
// full date-time. The coupon works until the END of the chosen day.
function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function fromDateInput(text) {
  return text ? new Date(`${text}T23:59:59`).toISOString() : null
}

// Admin-only: create discount codes, switch them on/off, see how often
// each has been used.
export default function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null) // null = create mode
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [form] = Form.useForm()
  const couponType = Form.useWatch('type', form)
  const { message } = AntdApp.useApp()

  async function loadCoupons() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data } = await couponApi.fetchCoupons()
      setCoupons(data.coupons)
    } catch (err) {
      setLoadError(err?.response?.data?.message || 'Could not load coupons.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  function openCreateModal() {
    setEditingCoupon(null)
    form.resetFields()
    form.setFieldsValue({ type: 'percent', minSubtotal: 0, isActive: true })
    setModalOpen(true)
  }

  function openEditModal(coupon) {
    setEditingCoupon(coupon)
    form.setFieldsValue({ ...coupon, expiresAt: toDateInput(coupon.expiresAt) })
    setModalOpen(true)
  }

  // Replaces one coupon in the list with the server's updated copy.
  function replaceCoupon(updated) {
    setCoupons((previous) => previous.map((item) => (item._id === updated._id ? updated : item)))
  }

  async function handleSubmit(values) {
    const data = {
      type: values.type,
      value: values.value,
      minSubtotal: values.minSubtotal ?? 0,
      usageLimit: values.usageLimit ?? null, // empty = no limit
      expiresAt: fromDateInput(values.expiresAt), // empty = never expires
      isActive: values.isActive,
    }
    setSubmitting(true)
    try {
      if (editingCoupon) {
        const { data: result } = await couponApi.updateCoupon(editingCoupon._id, data)
        replaceCoupon(result.coupon)
        message.success('Coupon updated')
      } else {
        const { data: result } = await couponApi.createCoupon({ ...data, code: values.code })
        setCoupons((previous) => [result.coupon, ...previous])
        message.success(`Coupon ${result.coupon.code} created`)
      }
      setModalOpen(false)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(coupon, isActive) {
    setBusyId(coupon._id)
    try {
      const { data } = await couponApi.updateCoupon(coupon._id, { isActive })
      replaceCoupon(data.coupon)
      message.success(`${coupon.code} is now ${isActive ? 'on' : 'off'}`)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(coupon) {
    setBusyId(coupon._id)
    try {
      await couponApi.deleteCoupon(coupon._id)
      setCoupons((previous) => previous.filter((item) => item._id !== coupon._id))
      message.success(`${coupon.code} deleted`)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code) => <span className="font-mono font-semibold text-slate-100">{code}</span>,
    },
    { title: 'Discount', key: 'discount', render: (_, coupon) => describe(coupon) },
    {
      title: 'Min. order',
      dataIndex: 'minSubtotal',
      key: 'minSubtotal',
      render: (value) => (value > 0 ? formatPrice(value) : <span className="text-slate-500">None</span>),
    },
    {
      title: 'Used',
      key: 'used',
      render: (_, coupon) => `${coupon.usedCount} / ${coupon.usageLimit ?? '∞'}`,
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (value) => (value ? formatDate(value) : <span className="text-slate-500">Never</span>),
    },
    { title: 'Status', key: 'status', render: (_, coupon) => <CouponStatusTag coupon={coupon} /> },
    {
      title: 'On',
      key: 'isActive',
      render: (_, coupon) => (
        <Switch
          size="small"
          checked={coupon.isActive}
          loading={busyId === coupon._id}
          onChange={(checked) => handleToggleActive(coupon, checked)}
          aria-label={`Turn ${coupon.code} ${coupon.isActive ? 'off' : 'on'}`}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, coupon) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => openEditModal(coupon)}>
            Edit
          </Button>
          <Popconfirm
            title={`Delete ${coupon.code}?`}
            description="Old orders keep their discount. Customers can't use this code any more."
            okText="Delete"
            cancelText="Keep"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(coupon)}
          >
            <Button size="small" danger disabled={busyId === coupon._id}>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <PageHeader
        title="Coupons"
        description="Discount codes customers can enter at checkout."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            New coupon
          </Button>
        }
      />

      {loadError ? (
        <Alert
          type="error"
          showIcon
          title="Could not load coupons"
          description={loadError}
          action={<Button size="small" onClick={loadCoupons}>Retry</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={coupons}
            loading={loading}
            pagination={false}
            scroll={{ x: 860 }}
            locale={{ emptyText: <Empty description={loading ? 'Loading coupons...' : 'No coupons yet'} /> }}
          />
        </div>
      )}

      <Modal
        title={editingCoupon ? `Edit ${editingCoupon.code}` : 'New coupon'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editingCoupon ? 'Save changes' : 'Create coupon'}
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit} requiredMark={false} className="mt-4">
          <Form.Item
            name="code"
            label="Code"
            extra={editingCoupon ? "The code can't be changed — customers may already know it." : 'What customers type, e.g. SAVE10.'}
            normalize={(value) => value?.toUpperCase()}
            rules={[
              { required: true, message: 'Please enter a code' },
              { pattern: /^[A-Z0-9-]{3,20}$/, message: '3–20 letters, numbers or dashes' },
            ]}
          >
            <Input disabled={Boolean(editingCoupon)} className="font-mono" maxLength={20} />
          </Form.Item>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="type" label="Discount type" rules={[{ required: true }]}>
              <Select options={TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="value"
              label={couponType === 'fixed' ? 'Amount off' : 'Percent off'}
              rules={[
                { required: true, message: 'Please enter the discount' },
                {
                  type: 'number',
                  min: 0.01,
                  max: couponType === 'percent' ? 100 : 1000000,
                  message: couponType === 'percent' ? 'Between 0.01 and 100' : 'Must be more than 0',
                },
              ]}
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                {...(couponType === 'fixed' ? { prefix: '$' } : { suffix: '%' })}
              />
            </Form.Item>
          </div>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="minSubtotal" label="Minimum order" extra="0 = any order.">
              <InputNumber min={0} precision={2} prefix="$" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="usageLimit" label="Total uses allowed" extra="Empty = unlimited. Each customer can use a code once.">
              <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="Unlimited" />
            </Form.Item>
          </div>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="expiresAt" label="Expires on" extra="Empty = never. Works until the end of that day.">
              <Input type="date" className="[color-scheme:dark]" />
            </Form.Item>
            <Form.Item name="isActive" label="On" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </AdminLayout>
  )
}
