import api from './axiosInstance'

// Customer: check a code at checkout. Only a preview — the server checks
// it again (and works out the real discount) when the order is placed.
export const applyCoupon = (code) => api.post('/coupons/apply', { code })

// The calls behind the coupon-management page, one set per panel — same
// idea as adminProductApi / sellerProductApi.
function couponManagerApi(base) {
  return {
    fetchAll: () => api.get(base),
    create: (data) => api.post(base, data),
    update: (id, data) => api.patch(`${base}/${id}`, data),
    remove: (id) => api.delete(`${base}/${id}`),
  }
}

// Admin: every coupon; new ones work on the whole site.
export const adminCouponApi = couponManagerApi('/coupons')
// Seller: only their shop's coupons, which only discount their own products.
export const sellerCouponApi = couponManagerApi('/seller/coupons')
