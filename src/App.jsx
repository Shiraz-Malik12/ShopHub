import { Navigate, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyOtpPage from './pages/auth/VerifyOtpPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetCodePage from './pages/auth/ResetCodePage'
import NewPasswordPage from './pages/auth/NewPasswordPage'
import DashboardPage from './pages/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import CategoriesPage from './pages/admin/CategoriesPage'
import ProductsPage from './pages/admin/ProductsPage'
import StorefrontProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import WishlistPage from './pages/WishlistPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import AdminOrdersPage from './pages/admin/OrdersPage'
import AdminDashboardPage from './pages/admin/DashboardPage'
import CustomersPage from './pages/admin/CustomersPage'
import CouponsPage from './pages/admin/CouponsPage'
import MessagesPage from './pages/admin/MessagesPage'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicRoute from './routes/PublicRoute'
import AdminRoute from './routes/AdminRoute'
import ContactPage from './pages/ContactPage'
import OpenShopPage from './pages/OpenShopPage'
import ShopPage from './pages/ShopPage'
import ShopsPage from './pages/admin/ShopsPage'
import SellerProductsPage from './pages/seller/ProductsPage'
import ShopProfilePage from './pages/seller/ShopProfilePage'
import SellerRoute from './routes/SellerRoute'

function App() {
  return (
    <Routes>
      {/* Mid-flow pages: not guest-only (you must have just come from
          Register/ForgotPassword) and not auth-only (you're not logged in
          yet), so they sit outside both guards and validate their own
          state (see VerifyOtpPage / ResetCodePage / NewPasswordPage). */}
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      {/* Forgot password: enter the emailed code, then choose a new password. */}
      <Route path="/reset-password/verify" element={<ResetCodePage />} />
      <Route path="/reset-password/new" element={<NewPasswordPage />} />
      

      <Route element={<PublicRoute />}>
        {/* An already-logged-in user hitting any of these is bounced to
            their home page (shop or admin) by PublicRoute. */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* The storefront is the home page — anyone can browse. */}
      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="/products" element={<StorefrontProductsPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/contact" element={<ContactPage />} />
      {/* One seller's shop and its products. */}
      <Route path="/shops/:slug" element={<ShopPage />} />
      {/* Guests have a cart and a wishlist too (kept in the browser); they
          only need to sign in at checkout. */}
      <Route path="/cart" element={<CartPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<DashboardPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        {/* Apply to sell, then see the application's status. */}
        <Route path="/open-shop" element={<OpenShopPage />} />
      </Route>

      {/* Seller panel: only for sellers with an approved shop. */}
      <Route element={<SellerRoute />}>
        <Route path="/seller" element={<Navigate to="/seller/products" replace />} />
        <Route path="/seller/products" element={<SellerProductsPage />} />
        <Route path="/seller/shop" element={<ShopProfilePage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/shops" element={<ShopsPage />} />
        <Route path="/admin/categories" element={<CategoriesPage />} />
        <Route path="/admin/products" element={<ProductsPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/customers" element={<CustomersPage />} />
        <Route path="/admin/coupons" element={<CouponsPage />} />
        <Route path="/admin/messages" element={<MessagesPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
