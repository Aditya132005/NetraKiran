import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin',              label: 'Dashboard',    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/admin/customers',    label: 'Customers',    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0' },
  { to: '/admin/orders',       label: 'Orders',       icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { to: '/admin/appointments', label: 'Appointments', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to: '/admin/products',     label: 'Products',     icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sideOpen, setSideOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 text-white flex flex-col transition-transform duration-200 ${sideOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-navy-700">
          <div className="w-10 h-10 bg-gold-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">NK</div>
          <div>
            <div className="font-heading font-bold text-sm leading-tight">Netra Kiran</div>
            <div className="text-[10px] text-navy-300 tracking-widest uppercase">Admin Panel</div>
          </div>
          <button className="ml-auto lg:hidden text-navy-400 hover:text-white" onClick={() => setSideOpen(false)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon }) => {
            const active = to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to)
            return (
              <Link key={to} to={to} onClick={() => setSideOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-navy-700 text-white' : 'text-navy-300 hover:bg-navy-800 hover:text-white'}`}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-navy-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gold-600 rounded-full flex items-center justify-center text-xs font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-navy-400">Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full text-navy-400 hover:text-red-400 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sideOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSideOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setSideOpen(true)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <h1 className="font-semibold text-gray-800">
              {navItems.find(n => n.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(n.to))?.label || 'Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              View Site
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
