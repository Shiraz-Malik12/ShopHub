import { useState } from 'react'
import { App as AntdApp, Avatar, Button, Form, Input, Popconfirm, Tag } from 'antd'
import { CheckCircleFilled, FileTextOutlined, RightOutlined, SettingOutlined, ShopOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import StoreLayout from '../components/layout/StoreLayout'
import * as profileApi from '../api/profileApi'
import { setAccessToken } from '../api/tokenStore'
import { useAuth } from '../context/AuthContext'

function Section({ title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-6 py-4">
        <h2 className="font-semibold text-slate-100">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

// Name (editable) and email (fixed — it's how you sign in).
function ProfileDetails() {
  const { user, updateUser } = useAuth()
  const { message } = AntdApp.useApp()
  const [saving, setSaving] = useState(false)

  async function handleSave(values) {
    setSaving(true)
    try {
      const { data } = await profileApi.updateProfile({ name: values.name })
      updateUser(data.user) // header + everywhere else now shows the new name
      message.success('Profile updated')
    } catch (err) {
      message.error(err?.response?.data?.message || 'Could not update your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section title="Profile details" description="Your name is shown on your account and orders.">
      <Form layout="vertical" requiredMark={false} initialValues={{ name: user.name }} onFinish={handleSave}>
        <Form.Item
          name="name"
          label="Full name"
          rules={[
            { required: true, message: 'Please enter your name' },
            { min: 2, max: 60, message: 'Name must be between 2 and 60 characters' },
          ]}
        >
          <Input size="large" autoComplete="name" />
        </Form.Item>
        <Form.Item label="Email" extra="Your email is used to sign in and can't be changed here.">
          <Input size="large" value={user.email} disabled />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={saving}>
          Save changes
        </Button>
      </Form>
    </Section>
  )
}

function ChangePassword() {
  const { message } = AntdApp.useApp()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  async function handleChange(values) {
    setSaving(true)
    try {
      const { data } = await profileApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      // The server started a fresh session for this device — use its token.
      setAccessToken(data.accessToken)
      form.resetFields()
      message.success('Password changed. Your other devices have been signed out.')
    } catch (err) {
      message.error(err?.response?.data?.message || 'Could not change your password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section title="Change password" description="Changing it signs you out on every other device.">
      <Form form={form} layout="vertical" requiredMark={false} onFinish={handleChange}>
        <Form.Item
          name="currentPassword"
          label="Current password"
          rules={[{ required: true, message: 'Please enter your current password' }]}
        >
          <Input.Password size="large" autoComplete="current-password" />
        </Form.Item>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="newPassword"
            label="New password"
            hasFeedback
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 8, message: 'At least 8 characters' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || value !== getFieldValue('currentPassword')) return Promise.resolve()
                  return Promise.reject(new Error('Must be different from your current password'))
                },
              }),
            ]}
          >
            <Input.Password size="large" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm new password"
            dependencies={['newPassword']}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || value === getFieldValue('newPassword')) return Promise.resolve()
                  return Promise.reject(new Error('Passwords do not match'))
                },
              }),
            ]}
          >
            <Input.Password size="large" autoComplete="new-password" />
          </Form.Item>
        </div>
        <Button type="primary" htmlType="submit" loading={saving}>
          Change password
        </Button>
      </Form>
    </Section>
  )
}

// One saved delivery address — checkout fills it in automatically.
function SavedAddress() {
  const { user, updateUser } = useAuth()
  const { message } = AntdApp.useApp()
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const saved = user.savedAddress

  async function handleSave(values) {
    setSaving(true)
    try {
      const { data } = await profileApi.saveAddress(values)
      updateUser(data.user)
      message.success('Address saved')
    } catch (err) {
      message.error(err?.response?.data?.message || 'Could not save your address.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    setRemoving(true)
    try {
      const { data } = await profileApi.removeAddress()
      updateUser(data.user)
      message.success('Address removed')
    } catch (err) {
      message.error(err?.response?.data?.message || 'Could not remove your address.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Section
      title="Delivery address"
      description={saved ? 'Checkout fills this in for you.' : 'Save an address so checkout fills it in for you.'}
    >
      {/* key: start the form fresh whenever the saved address changes (saved / removed). */}
      <Form
        key={saved ? JSON.stringify(saved) : 'empty'}
        layout="vertical"
        requiredMark={false}
        initialValues={saved || { fullName: user.name }}
        onFinish={handleSave}
      >
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="fullName"
            label="Full name"
            rules={[
              { required: true, message: 'Please enter the full name' },
              { min: 2, max: 80, message: 'Full name must be between 2 and 80 characters' },
            ]}
          >
            <Input size="large" autoComplete="name" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone number"
            rules={[
              { required: true, message: 'Please enter a phone number' },
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
            { required: true, message: 'Please enter the address' },
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
              { required: true, message: 'Please enter the city' },
              { min: 2, max: 80, message: 'City must be between 2 and 80 characters' },
            ]}
          >
            <Input size="large" autoComplete="address-level2" />
          </Form.Item>
          <Form.Item name="postalCode" label="Postal code (optional)" rules={[{ max: 20 }]}>
            <Input size="large" autoComplete="postal-code" />
          </Form.Item>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="primary" htmlType="submit" loading={saving}>
            {saved ? 'Update address' : 'Save address'}
          </Button>
          {saved && (
            <Popconfirm title="Remove your saved address?" okText="Remove" onConfirm={handleRemove}>
              <Button danger loading={removing}>
                Remove
              </Button>
            </Popconfirm>
          )}
        </div>
      </Form>
    </Section>
  )
}

// The signed-in user's account page: profile, password and saved address.
export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const quickLinks = [
    { to: '/orders', icon: <FileTextOutlined />, title: 'My orders', text: 'Track and review your orders' },
    { to: '/products', icon: <ShopOutlined />, title: 'Continue shopping', text: 'Browse the full product catalog' },
    ...(isAdmin
      ? [{ to: '/admin/dashboard', icon: <SettingOutlined />, title: 'Admin dashboard', text: 'Manage the store' }]
      : []),
  ]

  return (
    <StoreLayout>
      <section className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">My account</h1>
          <p className="mt-2 text-slate-400">Welcome back, {user?.name}.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar size={72} style={{ backgroundColor: '#4f46e5', fontSize: 28 }}>
                {user?.name?.[0]?.toUpperCase()}
              </Avatar>
              <h2 className="mt-4 text-lg font-semibold text-slate-100">{user?.name}</h2>
              <p className="break-all text-sm text-slate-400">{user?.email}</p>
              <div className="mt-3 flex gap-2">
                <Tag color={isAdmin ? 'purple' : 'blue'}>{isAdmin ? 'Admin' : 'Customer'}</Tag>
                {user?.isVerified && (
                  <Tag icon={<CheckCircleFilled />} color="success">
                    Verified
                  </Tag>
                )}
              </div>
            </div>
          </div>

          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-indigo-500/40 hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-lg text-indigo-400">
                {link.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-100">{link.title}</span>
                <span className="block text-sm text-slate-400">{link.text}</span>
              </span>
              <RightOutlined className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-indigo-400" />
            </Link>
          ))}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <ProfileDetails />
          <ChangePassword />
          <SavedAddress />
        </div>
      </div>
    </StoreLayout>
  )
}
