import api from './axiosInstance'

// Each dashboard's numbers, in one request.
// Admin: the whole marketplace.
export const fetchAdminDashboard = () => api.get('/admin/dashboard')
// Seller: only their own shop (the server enforces this).
export const fetchSellerDashboard = () => api.get('/seller/dashboard')
