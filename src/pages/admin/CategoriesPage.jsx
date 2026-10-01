import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Tag, Space, Popconfirm, Alert, Empty, App as AntdApp } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import * as categoryApi from '../../api/categoryApi'

// Admin-only category management: list, create, edit, deactivate/reactivate.
// Reachable only via AdminRoute (src/routes/AdminRoute.jsx) — but every
// mutation here still round-trips through protect + requireAdmin on the
// backend, which is the boundary that actually matters.
export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null) // null = create mode
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const { message } = AntdApp.useApp()

  async function loadCategories() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data } = await categoryApi.fetchAllCategoriesAdmin()
      setCategories(data.categories)
    } catch (err) {
      setLoadError(err?.response?.data?.message || 'Could not load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  function openCreateModal() {
    setEditingCategory(null)
    form.resetFields()
    setModalOpen(true)
  }

  function openEditModal(category) {
    setEditingCategory(category)
    form.setFieldsValue({ name: category.name })
    setModalOpen(true)
  }

  async function handleSubmit(values) {
    setSubmitting(true)
    try {
      if (editingCategory) {
        const { data } = await categoryApi.updateCategory(editingCategory._id, { name: values.name })
        setCategories((prev) => prev.map((c) => (c._id === data.category._id ? data.category : c)))
        message.success('Category updated')
      } else {
        const { data } = await categoryApi.createCategory({ name: values.name })
        setCategories((prev) => [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)))
        message.success('Category created')
      }
      setModalOpen(false)
    } catch (err) {
      // Left open on purpose — e.g. a 409 duplicate-name conflict is
      // something the admin can fix right in the form and resubmit.
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(category) {
    try {
      const { data } = category.isActive
        ? await categoryApi.deactivateCategory(category._id)
        : await categoryApi.updateCategory(category._id, { isActive: true })
      setCategories((prev) => prev.map((c) => (c._id === data.category._id ? data.category : c)))
      message.success(category.isActive ? 'Category deactivated' : 'Category reactivated')
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    }
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (name) => <span className="font-medium text-slate-100">{name}</span> },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug) => <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">{slug}</code>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, category) => (
        <Space>
          <Button size="small" onClick={() => openEditModal(category)}>
            Edit
          </Button>
          <Popconfirm
            title={category.isActive ? 'Deactivate this category?' : 'Reactivate this category?'}
            description={
              category.isActive ? 'Customers will no longer see it in the catalog.' : undefined
            }
            onConfirm={() => handleToggleActive(category)}
            okText={category.isActive ? 'Deactivate' : 'Reactivate'}
          >
            <Button size="small" danger={category.isActive}>
              {category.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <AdminLayout>
        <PageHeader
          title="Categories"
          description="Group your products so customers can find them. Deactivated categories hide their products from the store."
          actions={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              New category
            </Button>
          }
        />

        {loadError ? (
          <Alert
            type="error"
            showIcon
            title="Could not load categories"
            description={loadError}
            action={
              <Button size="small" onClick={loadCategories}>
                Retry
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <Table
              rowKey="_id"
              columns={columns}
              dataSource={categories}
              loading={loading}
              pagination={false}
              scroll={{ x: 640 }}
              locale={{
                emptyText: (
                  <Empty
                    description={loading ? 'Loading categories...' : 'No categories yet'}
                  />
                ),
              }}
            />
          </div>
        )}

        <Modal
          title={editingCategory ? 'Edit category' : 'New category'}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={() => form.submit()}
          okText={editingCategory ? 'Save' : 'Create'}
          confirmLoading={submitting}
          destroyOnHidden
        >
          <Form layout="vertical" form={form} onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              name="name"
              label="Category name"
              rules={[
                { required: true, message: 'Category name is required' },
                { max: 60, message: 'Category name must be at most 60 characters' },
              ]}
            >
              <Input size="large" placeholder="e.g. Electronics" autoFocus />
            </Form.Item>
          </Form>
        </Modal>
    </AdminLayout>
  )
}
