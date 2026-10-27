import api from './axiosInstance'

// Customer: check a code at checkout. Only a preview — the server checks
// it again (and works out the real discount) when the order is placed.
export const applyCoupon = (code) => api.post('/coupons/apply', { code })

// Admin only.
export const fetchCoupons = () => api.get('/coupons')
export const createCoupon = (data) => api.post('/coupons', data)
export const updateCoupon = (id, data) => api.patch(`/coupons/${id}`, data)
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`)
