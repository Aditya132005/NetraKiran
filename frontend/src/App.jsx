import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'

import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminOrders from './pages/admin/AdminOrders'
import AdminAppointments from './pages/admin/AdminAppointments'
import AdminProducts from './pages/admin/AdminProducts'

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
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
            <Route path="/signup" element={<PublicLayout><Signup /></PublicLayout>} />
            <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
            <Route path="/book-appointment" element={<PublicLayout><BookAppointment /></PublicLayout>} />

            {/* Customer (authenticated) */}
            <Route path="/dashboard" element={<ProtectedRoute><PublicLayout><CustomerDashboard /></PublicLayout></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><PublicLayout><Cart /></PublicLayout></ProtectedRoute>} />
            <Route path="/my-orders" element={<ProtectedRoute><PublicLayout><OrderHistory /></PublicLayout></ProtectedRoute>} />
            <Route path="/my-prescriptions" element={<ProtectedRoute><PublicLayout><MyPrescriptions /></PublicLayout></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="products" element={<AdminProducts />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
