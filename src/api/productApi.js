import api from './axiosInstance'

export const fetchProducts = () => api.get('/products')
export const fetchAllProductsAdmin = () => api.get('/products/admin')
export const fetchProduct = (id) => api.get(`/products/${id}`)
export const createProduct = (payload) => api.post('/products', payload)
export const updateProduct = (id, payload) => api.patch(`/products/${id}`, payload)
export const deactivateProduct = (id) => api.delete(`/products/${id}`)
