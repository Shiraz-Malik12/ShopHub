import api from './axiosInstance'

// The signed-in user's own account. One line per endpoint, like the other
// api files; the token is attached by axiosInstance.
export const updateProfile = (payload) => api.patch('/profile', payload)
export const changePassword = (payload) => api.patch('/profile/password', payload)
export const saveAddress = (address) => api.put('/profile/address', address)
export const removeAddress = () => api.delete('/profile/address')
