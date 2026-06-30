import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollProgress from './components/ScrollProgress'

function PageTransition({ children }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="animate-page-in">
      {children}
    </div>
  )
}

import Home from './pages/Home'
import Login from './pages/Login'
import ProductDetail from './pages/ProductDetail'

import CustomerSearch from './pages/CustomerSearch'
import CustomerRegister from './pages/CustomerRegister'
import CustomerProfile from './pages/CustomerProfile'

import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminCustomerDetail from './pages/admin/AdminCustomerDetail'
import AdminOrders from './pages/admin/AdminOrders'
import AdminAppointments from './pages/admin/AdminAppointments'
import AdminProducts from './pages/admin/AdminProducts'
import AdminUsers from './pages/admin/AdminUsers'
import AdminEmailOffer from './pages/admin/AdminEmailOffer'

import CustomerDashboard from './pages/customer/CustomerDashboard'
import Shop from './pages/customer/Shop'
import Cart from './pages/customer/Cart'
import OrderHistory from './pages/customer/OrderHistory'
import MyPrescriptions from './pages/customer/MyPrescriptions'
import BookAppointment from './pages/customer/BookAppointment'

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollProgress />
          <Routes>
            {/* Public */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
            <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
            <Route path="/product/:id" element={<PublicLayout><ProductDetail /></PublicLayout>} />
            <Route path="/book-appointment" element={<PublicLayout><BookAppointment /></PublicLayout>} />

            {/* Customer profile system (no auth required) */}
            <Route path="/customer-search" element={<PublicLayout><CustomerSearch /></PublicLayout>} />
            <Route path="/customer-register" element={<PublicLayout><CustomerRegister /></PublicLayout>} />
            <Route path="/customer/:id" element={<PublicLayout><CustomerProfile /></PublicLayout>} />

            {/* Legacy customer pages (auth optional — still accessible if logged in) */}
            <Route path="/dashboard" element={<PublicLayout><CustomerDashboard /></PublicLayout>} />
            <Route path="/cart" element={<PublicLayout><Cart /></PublicLayout>} />
            <Route path="/my-orders" element={<PublicLayout><OrderHistory /></PublicLayout>} />
            <Route path="/my-prescriptions" element={<PublicLayout><MyPrescriptions /></PublicLayout>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="customers/:id" element={<AdminCustomerDetail />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="email-offer" element={<AdminEmailOffer />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
