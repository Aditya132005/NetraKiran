import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-navy-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gold-600 rounded-lg flex items-center justify-center text-white font-heading font-bold text-lg shadow-sm">
              NK
            </div>
            <div>
              <div className="font-heading font-bold text-base leading-tight">Netra Kiran</div>
              <div className="text-[10px] text-navy-200 leading-tight tracking-widest uppercase">Optics</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" label="Home" active={isActive('/')} />
            <NavLink to="/shop" label="Shop" active={isActive('/shop')} />
            <NavLink to="/book-appointment" label="Book Appointment" active={isActive('/book-appointment')} />
            {user?.role === 'admin' && <NavLink to="/admin" label="Admin Panel" active={location.pathname.startsWith('/admin')} gold />}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role !== 'admin' && (
                  <Link to="/cart" className="relative p-2 hover:text-gold-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-600 rounded-full text-[10px] flex items-center justify-center font-bold">{count}</span>
                    )}
                  </Link>
                )}
                <div className="relative group">
                  <button className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 rounded-lg px-3 py-1.5 text-sm transition-colors">
                    <div className="w-6 h-6 bg-gold-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block max-w-24 truncate">{user.name?.split(' ')[0]}</span>
                    <svg className="w-3 h-3 text-navy-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 text-gray-700">
                    {user.role === 'admin' ? (
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" /></svg>
                        Admin Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          My Account
                        </Link>
                        <Link to="/my-orders" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                          My Orders
                        </Link>
                        <Link to="/my-prescriptions" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          My Prescriptions
                        </Link>
                      </>
                    )}
                    <hr className="my-1" />
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 hover:bg-red-50 text-red-600 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm text-navy-200 hover:text-white transition-colors px-3 py-1.5">Login</Link>
                <Link to="/signup" className="btn-gold text-sm py-1.5 px-4">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-navy-800 border-t border-navy-700 px-4 py-3 space-y-1">
          <MobileLink to="/" label="Home" onClick={() => setMenuOpen(false)} />
          <MobileLink to="/shop" label="Shop" onClick={() => setMenuOpen(false)} />
          <MobileLink to="/book-appointment" label="Book Appointment" onClick={() => setMenuOpen(false)} />
          {user?.role === 'admin' && <MobileLink to="/admin" label="Admin Panel" onClick={() => setMenuOpen(false)} />}
        </div>
      )}
    </nav>
  )
}

function NavLink({ to, label, active, gold }) {
  return (
    <Link to={to} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-navy-700 text-white' :
      gold ? 'text-gold-400 hover:text-gold-300 hover:bg-navy-800' :
      'text-navy-200 hover:text-white hover:bg-navy-800'
    }`}>{label}</Link>
  )
}

function MobileLink({ to, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="block px-3 py-2 rounded-lg text-sm text-navy-200 hover:text-white hover:bg-navy-700 transition-colors">{label}</Link>
  )
}
