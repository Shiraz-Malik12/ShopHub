import api from './axiosInstance'

// Thin, one-line-per-endpoint wrappers — mirrors productApi.js. Every cart
// endpoint needs a signed-in user; the token is attached by axiosInstance.
export const fetchCart = () => api.get('/cart')
export const addCartItem = (productId, quantity = 1) => api.post('/cart/items', { productId, quantity })
export const updateCartItem = (productId, quantity) => api.patch(`/cart/items/${productId}`, { quantity })
export const removeCartItem = (productId) => api.delete(`/cart/items/${productId}`)
export const clearCart = () => api.delete('/cart')
