import AdminLayout from '../../components/layout/AdminLayout'
import ProductManager from '../../components/admin/ProductManager'
import { adminProductApi } from '../../api/productApi'

// Admin: every product in the marketplace, with the shop that sells it.
// Products added here go to the ShopHub Official shop.
export default function ProductsPage() {
  return (
    <AdminLayout>
      <ProductManager
        api={adminProductApi}
        showShop
        title="Products"
        description="Every product on ShopHub. New products you add go to the ShopHub Official shop."
      />
    </AdminLayout>
  )
}
