import { Navigate, Route, Routes } from 'react-router-dom'
import StorefrontLayout from './app/storefront/layouts/StorefrontLayout'
import AdminLayout from './app/admin/layouts/AdminLayout'
import HomePage from './app/storefront/pages/HomePage'
import CatalogPage from './app/storefront/pages/CatalogPage'
import ProductPage from './app/storefront/pages/ProductPage'
import CheckoutPage from './app/storefront/pages/CheckoutPage'
import LoginPage from './app/admin/pages/LoginPage'
import DashboardPage from './app/admin/pages/DashboardPage'
import OrdersPage from './app/admin/pages/OrdersPage'
import OrderDetailsPage from './app/admin/pages/OrderDetailsPage'
import RequireAdmin from './app/admin/components/RequireAdmin'
import AdminCatalogPage from './app/admin/pages/CatalogPage'

export default function App() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<CatalogPage />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
      </Route>
      <Route path="admin/login" element={<LoginPage />} />
      <Route element={<RequireAdmin />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="catalog" element={<AdminCatalogPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
