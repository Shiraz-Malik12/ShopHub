import api from './axiosInstance'

// Thin, one-line-per-endpoint wrappers — mirrors productApi.js. These need a
// signed-in user; the token is attached by axiosInstance.
export const fetchCart = () => api.get('/cart')
export const addCartItem = (productId, quantity = 1) => api.post('/cart/items', { productId, quantity })
export const updateCartItem = (productId, quantity) => api.patch(`/cart/items/${productId}`, { quantity })
export const removeCartItem = (productId) => api.delete(`/cart/items/${productId}`)
export const clearCart = () => api.delete('/cart')

// Guest carts: `items` is the browser's list of { productId, quantity }.
// preview is public (prices the list, saves nothing); merge needs a signed-in
// user and moves the list into their account cart.
export const previewCart = (items) => api.post('/cart/preview', { items })
export const mergeCart = (items) => api.post('/cart/merge', { items })
