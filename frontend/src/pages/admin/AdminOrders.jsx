import { useState, useEffect } from 'react'
import api from '../../utils/api'

const STATUSES = ['all','pending','processing','ready','delivered','cancelled']
const BADGE = { pending:'badge-pending', processing:'badge-processing', ready:'badge-ready', delivered:'badge-delivered', cancelled:'badge-cancelled' }

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [estDelivery, setEstDelivery] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/orders').then(r => setOrders(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const updateStatus = async () => {
    if (!newStatus) return
    setUpdating(true)
    await api.put(`/orders/${selected.id}/status`, { status: newStatus, estimated_delivery: estDelivery })
    load()
    setSelected(prev => ({ ...prev, status: newStatus, estimated_delivery: estDelivery }))
    setUpdating(false)
  }

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors border ${filter===s ? 'bg-navy-800 text-white border-navy-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {s}
            {s !== 'all' && <span className="ml-1.5 text-xs opacity-70">({orders.filter(o => o.status===s).length})</span>}
            {s === 'all' && <span className="ml-1.5 text-xs opacity-70">({orders.length})</span>}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-400 text-sm text-center py-12">Loading orders…</p> : (
        <>
          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Order ID','Customer','Items','Amount','Vision Type','Status','Date','Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan="8" className="px-4 py-12 text-center text-gray-400">No orders found</td></tr>
                  ) : filtered.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{o.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{o.customer_name}</p>
                        <p className="text-xs text-gray-400">{o.customer_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {o.items?.slice(0,2).map(i => <p key={i.id} className="truncate max-w-32">{i.product_name}</p>)}
                        {o.items?.length > 2 && <p>+{o.items.length-2} more</p>}
                      </td>
                      <td className="px-4 py-3 font-semibold">₹{o.total_amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{o.vision_type || '—'}</td>
                      <td className="px-4 py-3"><span className={BADGE[o.status] || 'badge bg-gray-100 text-gray-600'}>{o.status}</span></td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelected(o); setNewStatus(o.status); setEstDelivery(o.estimated_delivery||'') }}
                          className="text-navy-700 hover:text-navy-900 text-xs font-medium">View →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-lg">Order #{selected.id}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4 mb-5 p-4 bg-gray-50 rounded-xl text-sm">
              <div><span className="text-gray-400 text-xs uppercase">Customer</span><p className="font-medium mt-0.5">{selected.customer_name}</p></div>
              <div><span className="text-gray-400 text-xs uppercase">Phone</span><p className="font-medium mt-0.5">{selected.customer_phone || '—'}</p></div>
              <div><span className="text-gray-400 text-xs uppercase">Ordered On</span><p className="font-medium mt-0.5">{new Date(selected.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p></div>
              {selected.vision_type && <div><span className="text-gray-400 text-xs uppercase">Vision Type</span><p className="font-medium mt-0.5">{selected.vision_type}</p></div>}
              {selected.lens_type && <div><span className="text-gray-400 text-xs uppercase">Lens Type</span><p className="font-medium mt-0.5">{selected.lens_type}</p></div>}
              {selected.special_instructions && <div className="col-span-2"><span className="text-gray-400 text-xs uppercase">Special Instructions</span><p className="font-medium mt-0.5">{selected.special_instructions}</p></div>}
            </div>

            {/* Items */}
            <div className="mb-5">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Order Items</h4>
              <div className="space-y-2">
                {selected.items?.map(i => (
                  <div key={i.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {i.product_image && <img src={i.product_image} alt="" className="w-12 h-12 rounded-lg object-cover" onError={e=>e.target.style.display='none'}/>}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{i.product_name}</p>
                      <p className="text-xs text-gray-400">Qty: {i.quantity}</p>
                    </div>
                    <p className="font-semibold">₹{(i.price * i.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{selected.subtotal?.toLocaleString()}</span></div>
                {selected.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{selected.discount_amount?.toLocaleString()}</span></div>}
                <div className="flex justify-between font-bold text-gray-900 border-t pt-1"><span>Total</span><span>₹{selected.total_amount?.toLocaleString()}</span></div>
              </div>
            </div>

            {/* Update Status */}
            <div className="border-t pt-5">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Update Order Status</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="label text-xs">Status</label>
                  <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="ready">Ready for Pickup</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Estimated Delivery</label>
                  <input type="date" className="input" value={estDelivery} onChange={e => setEstDelivery(e.target.value)} />
                </div>
              </div>
              <button onClick={updateStatus} disabled={updating} className="btn-primary text-sm py-2">
                {updating ? 'Updating…' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
