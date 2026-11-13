import SellerLayout from '../../components/layout/SellerLayout'
import DashboardView from '../../components/admin/DashboardView'
import { fetchSellerDashboard } from '../../api/dashboardApi'

// Seller home: how THEIR shop is doing — sales, orders waiting, low stock.
export default function SellerDashboardPage() {
  return (
    <SellerLayout>
      <DashboardView
        fetchDashboard={fetchSellerDashboard}
        basePath="/seller"
        description="A quick look at how your shop is doing."
        customersHint="People who have ordered from your shop"
      />
    </SellerLayout>
  )
}
