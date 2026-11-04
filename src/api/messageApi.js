import api from "./axiosInstance";
export const fetchMessages = () => api.get('/admin/messages')
export const sendMessage = (data) => api.post('/messages', data)
export const resolveMessage = (id) => api.patch(`/admin/messages/${id}/resolve`) //admin only

