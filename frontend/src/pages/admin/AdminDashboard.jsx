import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'

const STATUS_COLORS = { pending:'badge-pending', processing:'badge-processing', ready:'badge-ready', delivered:'badge-delivered', cancelled:'badge-cancelled' }

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard…</div>
  if (!stats) return null

  const cards = [
    { label:'Total Sales',       value:`₹${(stats.totalSales||0).toLocaleString()}`, icon:'💰', color:'bg-green-50 border-green-200', text:'text-green-700' },
    { label:'Total Customers',   value:stats.totalCustomers, icon:'👥', color:'bg-blue-50 border-blue-200', text:'text-blue-700', link:'/admin/customers' },
    { label:'Pending Orders',    value:stats.pendingOrders,  icon:'⏳', color:'bg-yellow-50 border-yellow-200', text:'text-yellow-700', link:'/admin/orders' },
    { label:'Orders Delivered',  value:stats.deliveredOrders, icon:'✅', color:'bg-purple-50 border-purple-200', text:'text-purple-700' },
    { label:"Today's Appts",     value:stats.todayAppts,     icon:'📅', color:'bg-orange-50 border-orange-200', text:'text-orange-700', link:'/admin/appointments' },
    { label:'Pending Appts',     value:stats.pendingAppts,   icon:'🕐', color:'bg-red-50 border-red-200', text:'text-red-700' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon, color, text, link }) => {
          const inner = (
            <div className={`card border ${color} p-5 ${link ? 'hover:scale-105 transition-transform cursor-pointer' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${text}`}>{value}</p>
                </div>
                <span className="text-3xl">{icon}</span>
              </div>
            </div>
          )
          return link ? <Link key={label} to={link}>{inner}</Link> : <div key={label}>{inner}</div>
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-navy-700 hover:underline">View all →</Link>
          </div>
          {stats.recentOrders?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs border-b">
                    <th className="pb-2 font-medium">ID</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.recentOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="py-2.5 font-mono text-xs text-gray-500">#{o.id}</td>
                      <td className="py-2.5 font-medium text-gray-800">{o.customer_name}</td>
                      <td className="py-2.5 font-semibold">₹{o.total_amount?.toLocaleString()}</td>
                      <td className="py-2.5"><span className={STATUS_COLORS[o.status] || 'badge bg-gray-100 text-gray-600'}>{o.status}</span></td>
                      <td className="py-2.5 text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order status pie */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Orders by Status</h3>
          {stats.ordersByStatus?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data</p>
          ) : (
            <div className="space-y-3">
              {stats.ordersByStatus.map(({ status, count }) => {
                const total = stats.ordersByStatus.reduce((s, x) => s + x.count, 0)
                const pct = Math.round((count / total) * 100)
                const barColor = { pending:'bg-yellow-400', processing:'bg-blue-400', ready:'bg-purple-400', delivered:'bg-green-400', cancelled:'bg-red-400' }[status] || 'bg-gray-400'
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-gray-600">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Customers */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Customers</h3>
            <Link to="/admin/customers" className="text-xs text-navy-700 hover:underline">View all →</Link>
          </div>
          {stats.recentCustomers?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No customers yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentCustomers.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 text-sm font-bold flex-shrink-0">
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.title} {c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.phone || c.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Top Selling Products</h3>
          {!stats.topProducts?.length ? (
            <p className="text-gray-400 text-sm text-center py-6">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <div key={p.product_name} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-navy-100 rounded-full flex items-center justify-center text-xs font-bold text-navy-700">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.product_name}</p>
                    <p className="text-xs text-gray-400">{p.qty} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-green-700">₹{p.revenue?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
