import api from './axiosInstance'

// One line per endpoint, like cartApi.js. All need a signed-in user.
export const fetchWishlist = () => api.get('/wishlist')
export const addToWishlist = (productId) => api.post(`/wishlist/${productId}`)
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`)
