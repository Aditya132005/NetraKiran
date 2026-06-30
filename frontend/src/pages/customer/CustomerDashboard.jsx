import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

const BADGE = { pending:'badge-pending', processing:'badge-processing', ready:'badge-ready', delivered:'badge-delivered', cancelled:'badge-cancelled' }

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/orders'),
      api.get(`/prescriptions/customer/${user.id}`)
    ]).then(([o, p]) => {
      setOrders(o.data)
      setPrescriptions(p.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [user.id])

  const activeOrders = orders.filter(o => !['delivered','cancelled'].includes(o.status))
  const latestRx = prescriptions[0]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-navy-900">Hello, {user.title} {user.name?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 mt-1">Welcome to your NetraKiran dashboard</p>
      </div>

      {loading ? <p className="text-gray-400 text-center py-12">Loading your data…</p> : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label:'Total Orders', value:orders.length, icon:'📦', link:'/my-orders' },
              { label:'Active Orders', value:activeOrders.length, icon:'⏳', link:'/my-orders' },
              { label:'Prescriptions', value:prescriptions.length, icon:'👁', link:'/my-prescriptions' },
              { label:'My Discount', value:user.discount ? `${user.discount}%` : 'None', icon:'🎁', link:null },
            ].map(({ label, value, icon, link }) => {
              const inner = (
                <div className="card p-5 text-center hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-2">{icon}</div>
                  <div className="text-2xl font-bold text-navy-800">{value}</div>
                  <div className="text-xs text-gray-400 mt-1">{label}</div>
                </div>
              )
              return link ? <Link key={label} to={link}>{inner}</Link> : <div key={label}>{inner}</div>
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Orders */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Active Orders</h2>
                <Link to="/my-orders" className="text-xs text-navy-700 hover:underline">View all →</Link>
              </div>
              {activeOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-3">No active orders</p>
                  <Link to="/shop" className="btn-primary text-sm py-2">Browse Products</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOrders.slice(0,4).map(o => (
                    <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Order #{o.id}</p>
                        <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <span className={BADGE[o.status]}>{o.status}</span>
                        <p className="text-sm font-semibold mt-1">₹{o.total_amount?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Latest Prescription */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Latest Prescription</h2>
                <Link to="/my-prescriptions" className="text-xs text-navy-700 hover:underline">View all →</Link>
              </div>
              {!latestRx ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-3">No prescription on file</p>
                  <Link to="/book-appointment" className="btn-gold text-sm py-2">Book Eye Check</Link>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge bg-navy-100 text-navy-700">{latestRx.vision_type}</span>
                    <span className="text-xs text-gray-400">{new Date(latestRx.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                  </div>
                  <table className="text-xs w-full border-collapse">
                    <thead><tr className="bg-navy-800 text-white"><th className="p-2 text-left">Eye</th><th className="p-2">SPH</th><th className="p-2">CYL</th><th className="p-2">AXIS</th><th className="p-2">ADD</th></tr></thead>
                    <tbody>
                      <tr className="border-b text-center">
                        <td className="p-2 text-left font-medium bg-gray-50">OD (Right)</td>
                        {[latestRx.right_sph, latestRx.right_cyl, latestRx.right_axis, latestRx.right_add].map((v,i)=><td key={i} className="p-2">{v||'—'}</td>)}
                      </tr>
                      <tr className="text-center">
                        <td className="p-2 text-left font-medium bg-gray-50">OS (Left)</td>
                        {[latestRx.left_sph, latestRx.left_cyl, latestRx.left_axis, latestRx.left_add].map((v,i)=><td key={i} className="p-2">{v||'—'}</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { to:'/shop', icon:'🛍️', label:'Shop Now', desc:'Browse frames & lenses' },
              { to:'/book-appointment', icon:'📅', label:'Book Eye Check', desc:'Free consultation' },
              { to:'/my-orders', icon:'📦', label:'My Orders', desc:'Track your orders' },
              { to:'/my-prescriptions', icon:'📋', label:'Prescriptions', desc:'View your records' },
            ].map(({ to, icon, label, desc }) => (
              <Link key={to} to={to} className="card p-4 text-center hover:bg-navy-50 transition-colors group">
                <div className="text-3xl mb-2">{icon}</div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-navy-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
