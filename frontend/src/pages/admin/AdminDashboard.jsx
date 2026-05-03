import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'

const STATUS_COLORS = {
  pending: 'badge-pending', processing: 'badge-processing',
  ready: 'badge-ready', delivered: 'badge-delivered', cancelled: 'badge-cancelled'
}

const BAR_COLORS = {
  pending: 'bg-yellow-400', processing: 'bg-blue-400',
  ready: 'bg-purple-400', delivered: 'bg-green-400', cancelled: 'bg-red-400'
}

function fmt(n) { return (n || 0).toLocaleString('en-IN') }
function fmtMonth(m) {
  if (!m) return ''
  const [y, mo] = m.split('-')
  return new Date(y, mo - 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' })
}
function fmtDay(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [salesView, setSalesView] = useState('monthly')

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(err => setError(err.response?.data?.error || err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard…</div>
  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-red-500 font-medium">Dashboard error</p>
      <p className="text-sm text-gray-500 font-mono bg-gray-100 px-3 py-2 rounded">{error}</p>
      <button className="text-sm text-navy-700 underline" onClick={() => { setLoading(true); setError(null); api.get('/dashboard/stats').then(r => setStats(r.data)).catch(e => setError(e.message)).finally(() => setLoading(false)) }}>Retry</button>
    </div>
  )
  if (!stats) return null

  const monthlySales = stats.monthlySales || []
  const dailySales = stats.dailySales || []
  const chartData = salesView === 'monthly' ? [...monthlySales].reverse() : [...dailySales].slice(0, 14).reverse()
  const chartMax = Math.max(...chartData.map(d => d.total), 1)

  return (
    <div className="space-y-6">

      {/* ── Sales Overview ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Sales Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SalesCard label="Today's Sales"   value={`₹${fmt(stats.todaySales)}`}  sub={`${stats.todayOrders} orders today`}   color="bg-emerald-50 border-emerald-200" text="text-emerald-700" icon="📈" />
          <SalesCard label="This Month"      value={`₹${fmt(stats.monthSales)}`}  sub={new Date().toLocaleString('en-IN',{month:'long',year:'numeric'})} color="bg-blue-50 border-blue-200" text="text-blue-700" icon="📆" />
          <SalesCard label="Total Revenue"   value={`₹${fmt(stats.totalSales)}`}  sub={`${stats.totalOrders} orders total`}    color="bg-violet-50 border-violet-200" text="text-violet-700" icon="💰" />
          <SalesCard label="Delivered"       value={stats.deliveredOrders}         sub="orders fulfilled"                       color="bg-green-50 border-green-200"   text="text-green-700" icon="✅" />
        </div>
      </div>

      {/* ── Sales Chart ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800">Sales Chart</h3>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-xs">
            <button onClick={() => setSalesView('monthly')} className={`px-3 py-1 rounded-md font-medium transition-colors ${salesView === 'monthly' ? 'bg-white shadow text-navy-800' : 'text-gray-500 hover:text-gray-700'}`}>Monthly</button>
            <button onClick={() => setSalesView('daily')}   className={`px-3 py-1 rounded-md font-medium transition-colors ${salesView === 'daily'   ? 'bg-white shadow text-navy-800' : 'text-gray-500 hover:text-gray-700'}`}>Last 14 Days</button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">No sales data yet</p>
        ) : (
          <div className="flex items-end gap-2 h-48 mt-2">
            {chartData.map((d, i) => {
              const pct = Math.max((d.total / chartMax) * 100, 2)
              const label = salesView === 'monthly' ? fmtMonth(d.month) : fmtDay(d.day)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative min-w-0">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    ₹{fmt(d.total)}<br/>{d.orders} orders
                  </div>
                  <div className="w-full bg-navy-600 rounded-t-sm hover:bg-gold-500 transition-colors" style={{ height: `${pct}%` }} />
                  <span className="text-[9px] text-gray-400 truncate w-full text-center">{label}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Monthly summary table */}
        {salesView === 'monthly' && monthlySales.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400 border-b">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium text-right">Orders</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthlySales.map(m => (
                  <tr key={m.month} className="hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-700">{fmtMonth(m.month)}</td>
                    <td className="py-2 text-right text-gray-500">{m.orders}</td>
                    <td className="py-2 text-right font-semibold text-green-700">₹{fmt(m.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Customers"  value={stats.totalCustomers}  color="bg-blue-50 border-blue-200"    text="text-blue-700"   icon="👥" link="/admin/customers" />
        <StatCard label="Pending Orders"   value={stats.pendingOrders}   color="bg-yellow-50 border-yellow-200" text="text-yellow-700" icon="⏳" link="/admin/orders" />
        <StatCard label="Today's Appts"    value={stats.todayAppts}      color="bg-orange-50 border-orange-200" text="text-orange-700" icon="📅" link="/admin/appointments" />
        <StatCard label="Pending Appts"    value={stats.pendingAppts}    color="bg-red-50 border-red-200"       text="text-red-700"   icon="🕐" />
      </div>

      {/* ── Recent Orders + Order Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-navy-700 hover:underline">View all →</Link>
          </div>
          {!stats.recentOrders?.length ? (
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

        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Orders by Status</h3>
          {!stats.ordersByStatus?.length ? (
            <p className="text-gray-400 text-sm text-center py-8">No data</p>
          ) : (
            <div className="space-y-3">
              {stats.ordersByStatus.map(({ status, count }) => {
                const total = stats.ordersByStatus.reduce((s, x) => s + x.count, 0)
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-gray-600">{status}</span>
                      <span className="font-medium">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${BAR_COLORS[status] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Customers + Top Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Customers</h3>
            <Link to="/admin/customers" className="text-xs text-navy-700 hover:underline">View all →</Link>
          </div>
          {!stats.recentCustomers?.length ? (
            <p className="text-gray-400 text-sm text-center py-6">No customers yet</p>
          ) : (
            <div className="space-y-2">
              {stats.recentCustomers.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 text-sm font-bold flex-shrink-0">
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.title} {c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.phone || c.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Top Selling Products</h3>
          {!stats.topProducts?.length ? (
            <p className="text-gray-400 text-sm text-center py-6">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <div key={p.product_name} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-navy-100 rounded-full flex items-center justify-center text-xs font-bold text-navy-700 flex-shrink-0">{i + 1}</span>
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

function SalesCard({ label, value, sub, color, text, icon }) {
  return (
    <div className={`card border ${color} p-5`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-500">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${text}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function StatCard({ label, value, color, text, icon, link }) {
  const inner = (
    <div className={`card border ${color} p-4 ${link ? 'hover:scale-105 transition-transform cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className={`text-xl font-bold ${text}`}>{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
  return link ? <Link to={link}>{inner}</Link> : <div>{inner}</div>
}
