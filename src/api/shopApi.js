import api from './axiosInstance'

// The signed-in shopper's own shop application.
export const fetchMyShop = () => api.get('/shops/mine')
// values: { name, description, phone, city }
export const applyForShop = (values) => api.post('/shops', values)
export const updateMyShop = (values) => api.patch('/shops/mine', values)

// Public — a shop's page (approved shops only).
export const fetchPublicShop = (slug) => api.get(`/shops/${encodeURIComponent(slug)}`)

// Seller only — the approved shop the seller panel manages.
export const fetchSellerShop = () => api.get('/seller/shop')
// values: { description, phone, city } (the name can't be changed here)
export const updateSellerShop = (values) => api.patch('/seller/shop', values)
export const uploadShopLogo = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  return api.put('/seller/shop/logo', formData)
}
export const removeShopLogo = () => api.delete('/seller/shop/logo')

// Admin only — review shops.
// params (all optional): { status, search, page, limit }
export const fetchShops = (params) => api.get('/admin/shops', { params })
// status: 'approved' | 'rejected' | 'suspended'; reason is needed for rejected/suspended.
export const setShopStatus = (id, status, reason) => api.patch(`/admin/shops/${id}/status`, { status, reason })
