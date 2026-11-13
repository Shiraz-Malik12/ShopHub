import api from './axiosInstance'

// params (all optional): { search, category, sort } → /products?search=...&category=...&sort=...
export const fetchProducts = (params) => api.get('/products', { params })
export const fetchProduct = (id) => api.get(`/products/${id}`)

// The calls behind the product-management page. The admin and the seller
// panel use the same page with a different set: `base` is where products
// are created/changed, `listUrl` where the page's list comes from.
function productManagerApi({ base, listUrl, fetchCategories }) {
  return {
    fetchAll: () => api.get(listUrl),
    fetchCategories,
    create: (payload) => api.post(base, payload),
    update: (id, payload) => api.patch(`${base}/${id}`, payload),
    deactivate: (id) => api.delete(`${base}/${id}`),

    // Image uploads send FormData, not JSON. Don't set Content-Type yourself:
    // the browser adds "multipart/form-data; boundary=..." automatically, and
    // a hand-written header would be missing the boundary.
    uploadImages: (id, files) => {
      const formData = new FormData()
      files.forEach((file) => formData.append('images', file))
      return api.post(`${base}/${id}/images`, formData)
    },
    replaceImage: (id, imageId, file) => {
      const formData = new FormData()
      formData.append('image', file)
      return api.put(`${base}/${id}/images/${imageId}`, formData)
    },
    removeImage: (id, imageId) => api.delete(`${base}/${id}/images/${imageId}`),
  }
}

// Admin: every shop's products; new ones go to ShopHub Official.
export const adminProductApi = productManagerApi({
  base: '/products',
  listUrl: '/products/admin',
  fetchCategories: () => api.get('/categories/admin'),
})

// Seller: only their own shop's products (the server enforces this).
export const sellerProductApi = productManagerApi({
  base: '/seller/products',
  listUrl: '/seller/products',
  fetchCategories: () => api.get('/categories'),
})
