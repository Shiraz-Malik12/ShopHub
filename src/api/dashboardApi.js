import api from './axiosInstance'

// Admin only — store-wide numbers for the dashboard, in one request.
export const fetchDashboard = () => api.get('/admin/dashboard')
