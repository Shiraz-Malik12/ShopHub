import api from './axiosInstance'

// Reviews of one product. Reading is public; writing needs a signed-in user
// (the token is attached by axiosInstance).
export const fetchReviews = (productId) => api.get(`/products/${productId}/reviews`)
export const fetchMyReviewStatus = (productId) => api.get(`/products/${productId}/reviews/me`)
export const saveMyReview = (productId, review) => api.put(`/products/${productId}/reviews`, review)
export const deleteMyReview = (productId) => api.delete(`/products/${productId}/reviews`)

// Admin only.
export const adminDeleteReview = (productId, reviewId) => api.delete(`/products/${productId}/reviews/${reviewId}`)
