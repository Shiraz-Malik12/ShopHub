import AdminLayout from '../../components/layout/AdminLayout'
import CouponManager from '../../components/admin/CouponManager'
import { adminCouponApi } from '../../api/couponApi'

// Admin: every discount code on ShopHub. Codes made here work on the whole
// site; sellers' codes show which shop they belong to.
export default function CouponsPage() {
  return (
    <AdminLayout>
      <CouponManager
        api={adminCouponApi}
        showShop
        title="Coupons"
        description="Discount codes customers can enter at checkout — yours and every shop's."
        scopeNote="Coupons you create here work on every shop's products. The discount is shared fairly between the shops in a split order."
      />
    </AdminLayout>
  )
}
