import SellerLayout from '../../components/layout/SellerLayout'
import ProductManager from '../../components/admin/ProductManager'
import { sellerProductApi } from '../../api/productApi'

// Seller: the products of their own shop. Same page as the admin's, but
// talking to /api/seller/products, which only ever returns this shop's.
export default function SellerProductsPage() {
  return (
    <SellerLayout>
      <ProductManager
        api={sellerProductApi}
        title="Products"
        description="Add and manage the products your shop sells. Customers see them on ShopHub right away."
      />
    </SellerLayout>
  )
}
