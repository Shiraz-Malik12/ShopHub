import { useEffect, useState } from 'react'
import { Alert, App as AntdApp, Button, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd'
import Navbar from '../../components/Navbar'
import * as categoryApi from '../../api/categoryApi'
import * as productApi from '../../api/productApi'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const { message } = AntdApp.useApp()

  async function loadData() {
    setLoading(true)
    setLoadError(null)
    try {
      const [{ data: productData }, { data: categoryData }] = await Promise.all([
        productApi.fetchAllProductsAdmin(),
        categoryApi.fetchAllCategoriesAdmin(),
      ])
      setProducts(productData.products)
      setCategories(categoryData.categories)
    } catch (err) {
      setLoadError(err?.response?.data?.message || 'Could not load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openCreateModal() {
    setEditingProduct(null)
    form.resetFields()
    setModalOpen(true)
  }

  function openEditModal(product) {
    setEditingProduct(product)
    form.setFieldsValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category?._id,
    })
    setModalOpen(true)
  }

  async function handleSubmit(values) {
    setSubmitting(true)
    try {
      const { data } = editingProduct
        ? await productApi.updateProduct(editingProduct._id, values)
        : await productApi.createProduct(values)
      setProducts((previous) => {
        const remaining = previous.filter((product) => product._id !== data.product._id)
        return [...remaining, data.product].sort((a, b) => a.name.localeCompare(b.name))
      })
      setModalOpen(false)
      message.success(editingProduct ? 'Product updated' : 'Product created')
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(product) {
    try {
      const { data } = product.isActive
        ? await productApi.deactivateProduct(product._id)
        : await productApi.updateProduct(product._id, { isActive: true })
      setProducts((previous) => previous.map((item) => (item._id === data.product._id ? data.product : item)))
      message.success(product.isActive ? 'Product deactivated' : 'Product reactivated')
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    }
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', key: 'category', render: (_, product) => product.category?.name || 'Unknown' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (price) => `$${price.toFixed(2)}` },
    { title: 'Stock', dataIndex: 'stock', key: 'stock' },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, product) => (
        <Space>
          <Button size="small" onClick={() => openEditModal(product)}>Edit</Button>
          <Popconfirm
            title={product.isActive ? 'Deactivate this product?' : 'Reactivate this product?'}
            onConfirm={() => handleToggleActive(product)}
            okText={product.isActive ? 'Deactivate' : 'Reactivate'}
          >
            <Button size="small" danger={product.isActive}>
              {product.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-100">Products</h1>
          <Button type="primary" onClick={openCreateModal}>New product</Button>
        </div>

        {loadError ? (
          <Alert type="error" showIcon message="Could not load products" description={loadError} action={<Button size="small" onClick={loadData}>Retry</Button>} />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-2">
            <Table
              rowKey="_id"
              columns={columns}
              dataSource={products}
              loading={loading}
              pagination={false}
              locale={{ emptyText: <Empty description={loading ? 'Loading products...' : 'No products yet'} /> }}
            />
          </div>
        )}

        <Modal
          title={editingProduct ? 'Edit product' : 'New product'}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={() => form.submit()}
          okText={editingProduct ? 'Save' : 'Create'}
          confirmLoading={submitting}
          destroyOnHidden
        >
          <Form layout="vertical" form={form} onFinish={handleSubmit} requiredMark={false}>
            <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Product name is required' }, { max: 120 }]}>
              <Input autoFocus placeholder="e.g. iPhone 16 Pro" />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ max: 2000 }]}>
              <Input.TextArea rows={3} placeholder="Describe the product" />
            </Form.Item>
            <Space size="middle" style={{ display: 'flex' }}>
              <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Price is required' }, { type: 'number', min: 0, message: 'Price cannot be negative' }]} style={{ flex: 1 }}>
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="stock" label="Stock" rules={[{ required: true, message: 'Stock is required' }, { type: 'number', min: 0, message: 'Stock cannot be negative' }]} style={{ flex: 1 }}>
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Space>
            <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Category is required' }]}>
              <Select placeholder="Select a category" options={categories.filter((category) => category.isActive).map((category) => ({ value: category._id, label: category.name }))} />
            </Form.Item>
          </Form>
        </Modal>
      </main>
    </div>
  )
}
