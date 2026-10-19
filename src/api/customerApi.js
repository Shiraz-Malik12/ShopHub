import api from './axiosInstance'

// Admin only — the shop's customers.
// params (all optional): { search, status: 'active' | 'blocked', page, limit }
export const fetchCustomers = (params) => api.get('/admin/customers', { params })
export const fetchCustomer = (id) => api.get(`/admin/customers/${id}`)
export const setCustomerBlocked = (id, blocked) => api.patch(`/admin/customers/${id}/block`, { blocked })
