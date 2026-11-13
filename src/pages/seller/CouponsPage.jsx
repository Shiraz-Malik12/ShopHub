import SellerLayout from '../../components/layout/SellerLayout'
import CouponManager from '../../components/admin/CouponManager'
import { sellerCouponApi } from '../../api/couponApi'

// Seller: discount codes for THEIR shop. A code only takes money off this
// shop's products, and "minimum order" counts only this shop's items.
export default function SellerCouponsPage() {
  return (
    <SellerLayout>
      <CouponManager
        api={sellerCouponApi}
        title="Coupons"
        description="Discount codes for your shop. They only take money off your own products."
        scopeNote="This code only discounts your shop's products, and the minimum order counts only your items in the customer's cart."
      />
    </SellerLayout>
  )
}
