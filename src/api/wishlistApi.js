import api from './axiosInstance'

// One line per endpoint, like cartApi.js. These need a signed-in user.
export const fetchWishlist = () => api.get('/wishlist')
export const addToWishlist = (productId) => api.post(`/wishlist/${productId}`)
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`)

// Guest wishlists (ids kept in the browser): preview is public and returns
// the products; merge needs a signed-in user and saves them to the account.
export const previewWishlist = (productIds) => api.post('/wishlist/preview', { productIds })
export const mergeWishlist = (productIds) => api.post('/wishlist/merge', { productIds })
