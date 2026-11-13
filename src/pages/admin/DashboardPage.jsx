import AdminLayout from '../../components/layout/AdminLayout'
import DashboardView from '../../components/admin/DashboardView'
import { fetchAdminDashboard } from '../../api/dashboardApi'

// Admin home: how the whole marketplace is doing at a glance.
export default function DashboardPage() {
  return (
    <AdminLayout>
      <DashboardView
        fetchDashboard={fetchAdminDashboard}
        basePath="/admin"
        showShop
        description="A quick look at how the whole marketplace is doing."
      />
    </AdminLayout>
  )
}
