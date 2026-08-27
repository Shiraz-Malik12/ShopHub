import api from './axiosInstance'

// Thin, one-line-per-endpoint wrappers — mirrors authApi.js.
export const fetchCategories = () => api.get('/categories')
export const fetchAllCategoriesAdmin = () => api.get('/categories/admin')
export const fetchCategory = (idOrSlug) => api.get(`/categories/${idOrSlug}`)
export const createCategory = (payload) => api.post('/categories', payload)
export const updateCategory = (id, payload) => api.patch(`/categories/${id}`, payload)
export const deactivateCategory = (id) => api.delete(`/categories/${id}`)
