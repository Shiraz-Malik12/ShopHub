import { useEffect, useState } from 'react'
import { Alert, App as AntdApp, Button, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Upload } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import AdminLayout from '../../components/layout/AdminLayout'
import PageHeader from '../../components/layout/PageHeader'
import ProductImage from '../../components/ProductImage'
import { formatPrice } from '../../utils/formatPrice'
import ProductImagesManager from '../../components/admin/ProductImagesManager'
import { ALLOWED_TYPES, MAX_FILE_SIZE_MB, MAX_IMAGES, validateImageFiles } from '../../components/admin/productImageRules'
import * as categoryApi from '../../api/categoryApi'
import * as productApi from '../../api/productApi'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  // Images picked in the "New product" form. They can't be uploaded yet —
  // the product has no id until it's created — so they wait here and are
  // uploaded right after createProduct succeeds.
  const [pendingImages, setPendingImages] = useState([])
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

  // Looked up from `products` (not stored as a copy) so the edit form always
  // shows the latest images after every upload/remove/replace.
  const editingProduct = products.find((product) => product._id === editingProductId) || null

  function openCreateModal() {
    setEditingProductId(null)
    setPendingImages([])
    form.resetFields()
    setModalOpen(true)
  }

  function openEditModal(product) {
    setEditingProductId(product._id)
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
      let savedProduct = data.product
      let imageError = null

      if (!editingProduct && pendingImages.length > 0) {
        try {
          const files = pendingImages.map((item) => item.originFileObj)
          const { data: imageData } = await productApi.uploadProductImages(savedProduct._id, files)
          savedProduct = imageData.product
        } catch (err) {
          // The product itself was created fine — only the images failed.
          // Don't lose the product; tell the admin to retry from Edit.
          imageError = err?.response?.data?.message || 'Image upload failed.'
        }
      }

      setProducts((previous) => {
        const remaining = previous.filter((product) => product._id !== savedProduct._id)
        return [...remaining, savedProduct].sort((a, b) => a.name.localeCompare(b.name))
      })
      setModalOpen(false)
      if (imageError) {
        message.warning(`Product created, but images were not uploaded: ${imageError} Open Edit to add them.`)
      } else {
        message.success(editingProduct ? 'Product updated' : 'Product created')
      }
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

  function handleProductUpdated(updatedProduct) {
    setProducts((previous) => previous.map((item) => (item._id === updatedProduct._id ? updatedProduct : item)))
  }

  // Runs for each picked file. Returning false stops antd from uploading on
  // its own (we upload after the product is created); LIST_IGNORE drops an
  // invalid file from the list entirely.
  function handleBeforeImagePick(file) {
    const error = validateImageFiles([file])
    if (error) {
      message.error(error)
      return Upload.LIST_IGNORE
    }
    return false
  }

  const columns = [
    {
      title: 'Product',
      key: 'product',
      render: (_, product) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-800">
            <ProductImage src={product.images?.[0]?.url} alt={product.name} className="h-full w-full" compact />
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-100">{product.name}</div>
            <div className="text-xs text-slate-400">{product.category?.name || 'Unknown category'}</div>
          </div>
        </div>
      ),
    },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (price) => <span className="font-medium">{formatPrice(price)}</span> },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => <span className={stock === 0 ? 'whitespace-nowrap font-medium text-rose-400' : ''}>{stock === 0 ? 'Out of stock' : stock}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>,
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
    <AdminLayout>
        <PageHeader
          title="Products"
          description="Add, edit and manage the products in your store."
          actions={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              New product
            </Button>
          }
        />

        {loadError ? (
          <Alert type="error" showIcon title="Could not load products" description={loadError} action={<Button size="small" onClick={loadData}>Retry</Button>} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <Table
              rowKey="_id"
              columns={columns}
              dataSource={products}
              loading={loading}
              pagination={false}
              scroll={{ x: 720 }}
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
          width={680}
          destroyOnHidden
        >
          <Form layout="vertical" form={form} onFinish={handleSubmit} requiredMark={false}>
            <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Product name is required' }, { max: 120 }]}>
              <Input autoFocus placeholder="e.g. iPhone 16 Pro" />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ max: 2000 }]}>
              <Input.TextArea rows={3} placeholder="Describe the product" />
            </Form.Item>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Price is required' }, { type: 'number', min: 0, message: 'Price cannot be negative' }]}>
                <InputNumber min={0} precision={2} prefix="$" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="stock" label="Stock" rules={[{ required: true, message: 'Stock is required' }, { type: 'number', min: 0, message: 'Stock cannot be negative' }]}>
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Category is required' }]}>
              <Select placeholder="Select a category" options={categories.filter((category) => category.isActive).map((category) => ({ value: category._id, label: category.name }))} />
            </Form.Item>

            {editingProduct ? (
              <Form.Item label="Images">
                <ProductImagesManager product={editingProduct} onProductUpdated={handleProductUpdated} />
              </Form.Item>
            ) : (
              <Form.Item
                label="Images"
                extra={`Optional · up to ${MAX_IMAGES} · JPG, PNG or WebP · max ${MAX_FILE_SIZE_MB} MB each · first image is the main image`}
              >
                <Upload
                  listType="picture-card"
                  accept={ALLOWED_TYPES.join(',')}
                  multiple
                  maxCount={MAX_IMAGES}
                  fileList={pendingImages}
                  beforeUpload={handleBeforeImagePick}
                  onChange={({ fileList }) => setPendingImages(fileList)}
                >
                  {pendingImages.length < MAX_IMAGES && (
                    <button type="button" className="flex flex-col items-center gap-1 border-0 bg-transparent">
                      <PlusOutlined />
                      <span className="text-xs">Add image</span>
                    </button>
                  )}
                </Upload>
              </Form.Item>
            )}
          </Form>
        </Modal>
    </AdminLayout>
  )
}
