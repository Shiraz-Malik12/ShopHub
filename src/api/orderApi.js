import api from './axiosInstance'

// Thin, one-line-per-endpoint wrappers — mirrors cartApi.js. Every order
// endpoint needs a signed-in user; the token is attached by axiosInstance.
// saveAddress: true → the server also remembers this address on the account.
// couponCode (optional): only the code is sent — the server works out the discount.
export const placeOrder = (shippingAddress, saveAddress = false, couponCode) =>
  api.post('/orders', { shippingAddress, saveAddress, couponCode })
export const fetchMyOrders = () => api.get('/orders/mine')
export const fetchOrder = (id) => api.get(`/orders/${id}`)
export const cancelOrder = (id) => api.patch(`/orders/${id}/cancel`)

// Admin only. params (optional): { status }
export const fetchAllOrdersAdmin = (params) => api.get('/orders/admin', { params })
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status })
