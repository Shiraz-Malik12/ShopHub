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

// The calls behind the order-management page, one set per panel — same idea
// as adminProductApi / sellerProductApi. params (optional): { status }
// Admin: every shop's orders.
export const adminOrderApi = {
  fetchAll: (params) => api.get('/orders/admin', { params }),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
}
// Seller: only their own shop's orders (the server enforces this).
export const sellerOrderApi = {
  fetchAll: (params) => api.get('/seller/orders', { params }),
  updateStatus: (id, status) => api.patch(`/seller/orders/${id}/status`, { status }),
}
