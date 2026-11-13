import SellerLayout from '../../components/layout/SellerLayout'
import OrderManager from '../../components/admin/OrderManager'
import { sellerOrderApi } from '../../api/orderApi'

// Seller: the orders customers placed with THIS shop — what to pack, where
// to send it, and buttons to move each order along.
export default function SellerOrdersPage() {
  return (
    <SellerLayout>
      <OrderManager
        api={sellerOrderApi}
        title="Orders"
        description="Orders for your shop. Pack them, send them, and keep the status up to date — the customer is emailed at each step."
      />
    </SellerLayout>
  )
}
