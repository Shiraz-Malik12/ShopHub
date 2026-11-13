import api from './axiosInstance'

// The signed-in shopper's own shop application.
export const fetchMyShop = () => api.get('/shops/mine')
// values: { name, description, phone, city }
export const applyForShop = (values) => api.post('/shops', values)
export const updateMyShop = (values) => api.patch('/shops/mine', values)

// Admin only — review shops.
// params (all optional): { status, search, page, limit }
export const fetchShops = (params) => api.get('/admin/shops', { params })
// status: 'approved' | 'rejected' | 'suspended'; reason is needed for rejected/suspended.
export const setShopStatus = (id, status, reason) => api.patch(`/admin/shops/${id}/status`, { status, reason })
