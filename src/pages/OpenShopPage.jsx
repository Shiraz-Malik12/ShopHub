import { useEffect, useRef, useState } from 'react'
import { Alert, App as AntdApp, Button, Form, Input, Skeleton } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, ShopOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import StoreLayout from '../components/layout/StoreLayout'
import ShopStatusTag from '../components/ShopStatusTag'
import { useAuth } from '../context/AuthContext'
import * as shopApi from '../api/shopApi'
import { formatDate } from '../utils/formatDate'

const STEPS = [
  { title: 'Apply', text: 'Tell us your shop name, city and phone number.' },
  { title: 'We review it', text: "The ShopHub team checks your details and emails you the result." },
  { title: 'Start selling', text: "Once approved, you'll add products and receive orders." },
]

// The same checks as the server (shopValidators.js), so most mistakes are
// caught before the form is even sent.
function ShopForm({ initialValues, submitLabel, saving, onSubmit, onCancel }) {
  return (
    <Form layout="vertical" initialValues={initialValues} onFinish={onSubmit} requiredMark={false}>
      <Form.Item
        name="name"
        label="Shop name"
        extra="Customers will see this on every product you sell."
        rules={[
          { required: true, whitespace: true, message: 'Please enter a shop name' },
          { min: 2, max: 60, message: 'Shop name must be between 2 and 60 characters' },
          { pattern: /[a-zA-Z0-9]/, message: 'Shop name must include at least one English letter or number' },
        ]}
      >
        <Input size="large" placeholder="Ali Electronics" maxLength={60} />
      </Form.Item>

      <Form.Item
        name="description"
        label="What do you sell? (optional)"
        rules={[{ max: 500, message: 'Description must be 500 characters or less' }]}
      >
        <Input.TextArea rows={4} maxLength={500} showCount placeholder="Phone accessories, chargers and headphones at fair prices." />
      </Form.Item>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Form.Item
          name="phone"
          label="Phone number"
          rules={[
            { required: true, message: 'Please enter a phone number' },
            { pattern: /^\+?[0-9][0-9\s-]{6,18}$/, message: 'Enter a valid phone number' },
          ]}
        >
          <Input size="large" placeholder="0300 1234567" autoComplete="tel" />
        </Form.Item>

        <Form.Item
          name="city"
          label="City"
          rules={[
            { required: true, whitespace: true, message: 'Please enter your city' },
            { min: 2, max: 80, message: 'City must be between 2 and 80 characters' },
          ]}
        >
          <Input size="large" placeholder="Lahore" autoComplete="address-level2" />
        </Form.Item>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="primary" htmlType="submit" size="large" loading={saving} icon={<ShopOutlined />}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button size="large" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </Form>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="w-32 shrink-0 text-sm text-subtle">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  )
}

function ShopDetails({ shop }) {
  return (
    <dl className="divide-y divide-line">
      <DetailRow label="Shop name">{shop.name}</DetailRow>
      <DetailRow label="Status">
        <ShopStatusTag status={shop.status} />
      </DetailRow>
      <DetailRow label="City">{shop.city}</DetailRow>
      <DetailRow label="Phone">{shop.phone}</DetailRow>
      <DetailRow label="Description">{shop.description || <span className="text-faint">Not added</span>}</DetailRow>
      <DetailRow label="Applied on">{formatDate(shop.createdAt)}</DetailRow>
    </dl>
  )
}

// Big icon + heading at the top of the "your application" card.
function StatusHeading({ icon, title, text }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 text-2xl text-highlight">{icon}</span>
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-subtle">{text}</p>
      </div>
    </div>
  )
}

function formValuesOf(shop) {
  return { name: shop.name, description: shop.description, phone: shop.phone, city: shop.city }
}

// "Sell on ShopHub": a shopper applies to open a shop, then sees where
// their application stands (pending → approved, or rejected with a reason
// they can fix and resend).
export default function OpenShopPage() {
  const { user, refreshUser } = useAuth()
  const isAdmin = user.role === 'admin'
  // undefined = still loading, null = hasn't applied yet.
  const [shop, setShop] = useState(undefined)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const { message } = AntdApp.useApp()

  useEffect(() => {
    if (isAdmin) return undefined
    let ignore = false
    setLoadError(null)
    shopApi
      .fetchMyShop()
      .then(({ data }) => !ignore && setShop(data.shop))
      .catch((err) => !ignore && setLoadError(err?.response?.data?.message || 'Could not load your shop.'))
    return () => {
      ignore = true
    }
  }, [isAdmin, reloadKey])

  // The admin may have approved or suspended the shop since this user
  // signed in. Reload the user so the menu ("My shop" / "Sell on ShopHub")
  // matches their new role without a page refresh.
  // `syncedStatus` makes sure this asks only once per shop status, even if
  // the answer still doesn't match.
  const isSeller = user.role === 'seller'
  const syncedStatus = useRef(null)
  useEffect(() => {
    if (!shop || syncedStatus.current === shop.status) return
    syncedStatus.current = shop.status
    if ((shop.status === 'approved') !== isSeller) refreshUser().catch(() => {})
  }, [shop, isSeller, refreshUser])

  async function handleSubmit(values) {
    setSaving(true)
    try {
      const { data } = shop ? await shopApi.updateMyShop(values) : await shopApi.applyForShop(values)
      setShop(data.shop)
      setEditing(false)
      message.success(data.message)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function renderContent() {
    if (isAdmin) {
      return (
        <Alert
          type="info"
          showIcon
          title="You run the marketplace"
          description="Admins don't open shops. Review shop applications from the admin panel instead."
          action={
            <Link to="/admin/shops">
              <Button size="small">Review shops</Button>
            </Link>
          }
        />
      )
    }

    if (loadError) {
      return (
        <Alert
          type="error"
          showIcon
          title="Could not load your shop"
          description={loadError}
          action={<Button size="small" onClick={() => setReloadKey((key) => key + 1)}>Retry</Button>}
        />
      )
    }

    if (shop === undefined) return <Skeleton active />

    // Not applied yet: how it works + the application form.
    if (shop === null) {
      return (
        <>
          <ol className="mb-8 grid gap-3 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-line bg-surface p-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coral/10 text-sm font-semibold text-highlight">
                  {index + 1}
                </span>
                <p className="mt-3 font-medium text-ink">{step.title}</p>
                <p className="mt-1 text-sm text-subtle">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-ink">Your shop details</h2>
            <ShopForm submitLabel="Send application" saving={saving} onSubmit={handleSubmit} />
          </div>
        </>
      )
    }

    // Rejected: show why, with the form ready to fix and send again.
    if (shop.status === 'rejected') {
      return (
        <div className="space-y-6">
          <Alert
            type="warning"
            showIcon
            title="Your application needs changes"
            description={
              <>
                <p>{shop.statusReason}</p>
                <p className="mt-1">Fix the details below and send it again.</p>
              </>
            }
          />
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
            <ShopForm initialValues={formValuesOf(shop)} submitLabel="Send again" saving={saving} onSubmit={handleSubmit} />
          </div>
        </div>
      )
    }

    // Pending, and the owner clicked "Edit application".
    if (shop.status === 'pending' && editing) {
      return (
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-ink">Edit your application</h2>
          <ShopForm
            initialValues={formValuesOf(shop)}
            submitLabel="Save changes"
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(false)}
          />
        </div>
      )
    }

    const heading = {
      pending: (
        <StatusHeading
          icon={<ClockCircleOutlined />}
          title="Your application is being reviewed"
          text={`We'll email you at ${user.email} as soon as it's reviewed. You can still change your details until then.`}
        />
      ),
      approved: (
        <StatusHeading
          icon={<CheckCircleOutlined />}
          title="Your shop is approved"
          text="You're a ShopHub seller now. Seller tools for adding products and managing orders are coming soon."
        />
      ),
      suspended: (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          title="Your shop is suspended"
          description={
            <>
              <p>{shop.statusReason}</p>
              <p className="mt-1">
                Your shop can&apos;t sell for now. <Link to="/contact">Contact us</Link> if you think this is a mistake.
              </p>
            </>
          }
        />
      ),
    }[shop.status]

    return (
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        {heading}
        <ShopDetails shop={shop} />
        {shop.status === 'pending' && (
          <Button className="mt-4" onClick={() => setEditing(true)}>
            Edit application
          </Button>
        )}
      </div>
    )
  }

  return (
    <StoreLayout>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-ink">{isSeller ? 'My shop' : 'Sell on ShopHub'}</h1>
          <p className="mt-2 text-subtle">
            {isSeller
              ? 'Your shop on the ShopHub marketplace.'
              : 'Open your own shop and sell to every ShopHub customer.'}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10">{renderContent()}</div>
    </StoreLayout>
  )
}
