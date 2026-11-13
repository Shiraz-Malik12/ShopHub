import AdminLayout from '../../components/layout/AdminLayout'
import OrderManager from '../../components/admin/OrderManager'
import { adminOrderApi } from '../../api/orderApi'

// Admin: every shop's orders, with the shop that has to send each one.
export default function OrdersPage() {
  return (
    <AdminLayout>
      <OrderManager
        api={adminOrderApi}
        showShop
        title="Orders"
        description="Every order on ShopHub. Each shop's part of a purchase is its own order."
      />
    </AdminLayout>
  )
}
