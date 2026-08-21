import api from './axiosInstance'

// Thin, one-line-per-endpoint wrappers. Keeping these separate from
// AuthContext means the context focuses on *state*, this file on *requests*.
export const registerUser = (payload) => api.post('/auth/register', payload)
export const verifyOtp = (payload) => api.post('/auth/verify-otp', payload)
export const resendOtp = (payload) => api.post('/auth/resend-otp', payload)
export const loginUser = (payload) => api.post('/auth/login', payload)
export const refreshSession = () => api.post('/auth/refresh')
export const logoutUser = () => api.post('/auth/logout')
export const fetchCurrentUser = () => api.get('/auth/me')
export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload)
export const resetPassword = (payload) => api.post('/auth/reset-password', payload)
