import api from './axiosInstance'

// params (all optional): { search, category, sort } → /products?search=...&category=...&sort=...
export const fetchProducts = (params) => api.get('/products', { params })
export const fetchAllProductsAdmin = () => api.get('/products/admin')
export const fetchProduct = (id) => api.get(`/products/${id}`)
export const createProduct = (payload) => api.post('/products', payload)
export const updateProduct = (id, payload) => api.patch(`/products/${id}`, payload)
export const deactivateProduct = (id) => api.delete(`/products/${id}`)

// Image uploads send FormData, not JSON. Don't set Content-Type yourself:
// the browser adds "multipart/form-data; boundary=..." automatically, and
// a hand-written header would be missing the boundary.
export const uploadProductImages = (id, files) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('images', file))
  return api.post(`/products/${id}/images`, formData)
}

export const replaceProductImage = (id, imageId, file) => {
  const formData = new FormData()
  formData.append('image', file)
  return api.put(`/products/${id}/images/${imageId}`, formData)
}

export const removeProductImage = (id, imageId) => api.delete(`/products/${id}/images/${imageId}`)
