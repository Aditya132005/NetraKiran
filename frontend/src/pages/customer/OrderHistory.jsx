import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'

const BADGE = { pending:'badge-pending', processing:'badge-processing', ready:'badge-ready', delivered:'badge-delivered', cancelled:'badge-cancelled' }
const STATUS_LABEL = { pending:'Order placed, awaiting processing', processing:'Being prepared', ready:'Ready for pickup / Out for delivery', delivered:'Delivered successfully', cancelled:'Order cancelled' }

export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get('/orders').then(r => setOrders(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading orders…</div>

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-heading text-3xl font-bold text-navy-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="font-semibold text-gray-700 mb-2">No orders yet</h3>
          <p className="text-gray-400 text-sm mb-6">Start shopping to place your first order!</p>
          <Link to="/shop" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="card overflow-hidden">
              {/* Order Header */}
              <button className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {o.status === 'delivered' ? '✅' : o.status === 'cancelled' ? '❌' : o.status === 'ready' ? '🎁' : o.status === 'processing' ? '🔄' : '⏳'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900">Order #{o.id}</span>
                      <span className={BADGE[o.status] || 'badge bg-gray-100 text-gray-600'}>{o.status}</span>
                    </div>
                    <p className="text-xs text-gray-400">{STATUS_LABEL[o.status]}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-navy-800 text-lg">₹{o.total_amount?.toLocaleString()}</p>
                  {o.estimated_delivery && <p className="text-xs text-green-600 mt-0.5">Est. {new Date(o.estimated_delivery+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>}
                  <svg className={`w-4 h-4 text-gray-400 ml-auto mt-1 transition-transform ${expanded===o.id?'rotate-180':''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </div>
              </button>

              {/* Order Details */}
              {expanded === o.id && (
                <div className="border-t px-5 pb-5">
                  {/* Progress Steps */}
                  <div className="flex items-center gap-0 my-5">
                    {['pending','processing','ready','delivered'].map((s, i, arr) => {
                      const statuses = ['pending','processing','ready','delivered']
                      const currentIdx = statuses.indexOf(o.status)
                      const stepIdx = statuses.indexOf(s)
                      const done = o.status !== 'cancelled' && stepIdx <= currentIdx
                      const active = stepIdx === currentIdx && o.status !== 'cancelled'
                      return (
                        <div key={s} className="flex items-center flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${done ? 'bg-green-500 text-white' : active ? 'bg-navy-800 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {done && !active ? '✓' : i+1}
                          </div>
                          {i < arr.length - 1 && <div className={`flex-1 h-1 mx-1 rounded ${done && !active ? 'bg-green-500' : 'bg-gray-200'}`}/>}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 -mt-3 mb-4">
                    <span>Placed</span><span>Processing</span><span className="text-center">Ready</span><span className="text-right">Delivered</span>
                  </div>

                  {/* Items */}
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">Items Ordered</h4>
                  <div className="space-y-2 mb-4">
                    {o.items?.map(i => (
                      <div key={i.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {i.product_image && <img src={i.product_image} alt="" className="w-12 h-12 rounded-lg object-cover" onError={e=>e.target.style.display='none'}/>}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{i.product_name}</p>
                          <p className="text-xs text-gray-400">Qty: {i.quantity}</p>
                        </div>
                        <p className="font-semibold text-sm">₹{(i.price * i.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1.5">
                    {o.vision_type && <div className="flex justify-between text-gray-600"><span>Vision Type</span><span>{o.vision_type}</span></div>}
                    {o.lens_type && <div className="flex justify-between text-gray-600"><span>Lens Type</span><span>{o.lens_type}</span></div>}
                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{o.subtotal?.toLocaleString()}</span></div>
                    {o.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{o.discount_amount?.toLocaleString()}</span></div>}
                    <div className="flex justify-between font-bold text-gray-900 border-t pt-1.5"><span>Total Paid</span><span>₹{o.total_amount?.toLocaleString()}</span></div>
                  </div>

                  {o.special_instructions && (
                    <p className="text-xs text-gray-500 mt-3 bg-yellow-50 p-2 rounded">📝 {o.special_instructions}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
