import { useEffect, useRef, useState } from 'react'
import { Alert, App as AntdApp, Button, Form, Input, Popconfirm, Skeleton } from 'antd'
import { DeleteOutlined, ExportOutlined, UploadOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import SellerLayout from '../../components/layout/SellerLayout'
import PageHeader from '../../components/layout/PageHeader'
import ShopLogo from '../../components/ShopLogo'
import { validateImageFiles, ALLOWED_TYPES } from '../../components/admin/productImageRules'
import * as shopApi from '../../api/shopApi'

// Seller: how the shop looks to customers — logo, description, and the
// contact details ShopHub keeps. The name is fixed (it's in the shop's web
// address); renaming goes through ShopHub.
export default function ShopProfilePage() {
  const [shop, setShop] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [logoBusy, setLogoBusy] = useState(false)
  const fileInputRef = useRef(null)
  const [form] = Form.useForm()
  const { message } = AntdApp.useApp()

  useEffect(() => {
    let ignore = false
    shopApi
      .fetchSellerShop()
      .then(({ data }) => !ignore && setShop(data.shop))
      .catch((err) => !ignore && setLoadError(err?.response?.data?.message || 'Could not load your shop.'))
    return () => {
      ignore = true
    }
  }, [])

  async function handleSave(values) {
    setSaving(true)
    try {
      const { data } = await shopApi.updateSellerShop(values)
      setShop(data.shop)
      message.success(data.message)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function runLogoAction(request) {
    setLogoBusy(true)
    try {
      const { data } = await request()
      setShop(data.shop)
      message.success(data.message)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLogoBusy(false)
    }
  }

  function handleLogoPicked(event) {
    const [file] = event.target.files
    event.target.value = '' // so picking the same file again still works
    if (!file) return
    const error = validateImageFiles([file])
    if (error) return message.error(error)
    runLogoAction(() => shopApi.uploadShopLogo(file))
  }

  return (
    <SellerLayout>
      <PageHeader
        title="Shop profile"
        description="How your shop looks to customers on ShopHub."
        actions={
          shop && (
            <Link to={`/shops/${shop.slug}`}>
              <Button icon={<ExportOutlined />}>View shop page</Button>
            </Link>
          )
        }
      />

      {loadError ? (
        <Alert type="error" showIcon title="Could not load your shop" description={loadError} />
      ) : !shop ? (
        <Skeleton active />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-line bg-surface p-6 shadow-card">
            <h2 className="font-semibold text-ink">Logo</h2>
            <div className="mt-4 flex flex-col items-center gap-4">
              <ShopLogo shop={shop} size={112} />
              <input ref={fileInputRef} type="file" accept={ALLOWED_TYPES.join(',')} hidden onChange={handleLogoPicked} />
              <div className="flex flex-wrap justify-center gap-2">
                <Button icon={<UploadOutlined />} loading={logoBusy} onClick={() => fileInputRef.current.click()}>
                  {shop.logo ? 'Change logo' : 'Upload logo'}
                </Button>
                {shop.logo && (
                  <Popconfirm title="Remove your logo?" okText="Remove" onConfirm={() => runLogoAction(shopApi.removeShopLogo)}>
                    <Button danger icon={<DeleteOutlined />} disabled={logoBusy} aria-label="Remove logo" />
                  </Popconfirm>
                )}
              </div>
              <p className="text-center text-xs text-faint">Square images look best. JPG, PNG or WebP.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-6 shadow-card lg:col-span-2">
            <h2 className="mb-4 font-semibold text-ink">Details</h2>
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              initialValues={{ description: shop.description, phone: shop.phone, city: shop.city }}
              onFinish={handleSave}
            >
              <Form.Item label="Shop name" extra="Your name is part of your shop's web address. Contact us to change it.">
                <Input value={shop.name} disabled />
              </Form.Item>
              <Form.Item
                name="description"
                label="What do you sell?"
                rules={[{ max: 500, message: 'Description must be 500 characters or less' }]}
              >
                <Input.TextArea rows={4} maxLength={500} showCount />
              </Form.Item>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <Form.Item
                  name="phone"
                  label="Phone number"
                  extra="Only ShopHub sees this."
                  rules={[
                    { required: true, message: 'Please enter a phone number' },
                    { pattern: /^\+?[0-9][0-9\s-]{6,18}$/, message: 'Enter a valid phone number' },
                  ]}
                >
                  <Input autoComplete="tel" />
                </Form.Item>
                <Form.Item
                  name="city"
                  label="City"
                  rules={[
                    { required: true, whitespace: true, message: 'Please enter your city' },
                    { min: 2, max: 80, message: 'City must be between 2 and 80 characters' },
                  ]}
                >
                  <Input autoComplete="address-level2" />
                </Form.Item>
              </div>
              <Button type="primary" htmlType="submit" loading={saving}>
                Save changes
              </Button>
            </Form>
          </section>
        </div>
      )}
    </SellerLayout>
  )
}
