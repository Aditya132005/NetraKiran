import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

const VISION_TYPES = ['Single Vision','Progressive','Bifocal','Trifocal','Photochromic','Blue Cut','Tinted']
const LENS_TYPES = ['CR39 Standard','Polycarbonate','High Index 1.6','High Index 1.67','High Index 1.74']

export default function Cart() {
  const { items, removeItem, updateQty, clearCart, total, count } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [prescriptions, setPrescriptions] = useState([])
  const [visionType, setVisionType] = useState('')
  const [lensType, setLensType] = useState('')
  const [prescId, setPrescId] = useState('')
  const [instructions, setInstructions] = useState('')
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user) api.get(`/prescriptions/customer/${user.id}`).then(r => setPrescriptions(r.data)).catch(() => {})
  }, [user])

  const hasLens = items.some(i => i.category === 'lens' || i.category === 'frame')
  const discountPct = user?.discount || 0
  const discountAmt = Math.round(total * discountPct / 100)
  const finalTotal = total - discountAmt

  const placeOrder = async () => {
    setPlacing(true)
    try {
      await api.post('/orders', {
        items: items.map(i => ({ product_id: i.product_id, product_name: i.product_name, product_image: i.product_image, quantity: i.quantity, price: i.price })),
        subtotal: total,
        discount_amount: discountAmt,
        total_amount: finalTotal,
        vision_type: visionType || null,
        prescription_id: prescId || null,
        lens_type: lensType || null,
        special_instructions: instructions || null,
      })
      clearCart()
      setSuccess(true)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  if (success) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🎉</div>
        <h2 className="font-heading text-3xl font-bold text-navy-900 mb-3">Order Placed!</h2>
        <p className="text-gray-500 mb-2">Thank you for your order. Our team will process it and keep you updated.</p>
        <p className="text-sm text-gray-400 mb-8">For prescription lenses/frames, we'll contact you to confirm the power details.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/my-orders" className="btn-primary">Track My Orders</Link>
          <Link to="/shop" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  )

  if (items.length === 0) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-7xl mb-6">🛒</div>
        <h2 className="font-heading text-2xl font-bold text-navy-900 mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some eyewear to get started!</p>
        <Link to="/shop" className="btn-primary">Browse Products</Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-heading text-3xl font-bold text-navy-900 mb-6">Your Cart ({count} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.product_id} className="card p-4 flex gap-4">
              {item.product_image && (
                <img src={item.product_image} alt={item.product_name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  onError={e => { e.target.style.display='none' }}/>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{item.product_name}</h3>
                <p className="text-sm text-gray-400 capitalize mt-0.5">{item.category}</p>
                <p className="font-bold text-navy-800 mt-1">₹{item.price?.toLocaleString()} each</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-50 rounded-l-lg text-lg">−</button>
                    <span className="px-3 text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-50 rounded-r-lg text-lg">+</button>
                  </div>
                  <span className="font-semibold text-gray-700">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => removeItem(item.product_id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          ))}

          {/* Prescription / Lens Options */}
          {hasLens && (
            <div className="card p-5 border-2 border-navy-100 bg-navy-50/30">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>👁</span> Lens & Prescription Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="label">Vision Type</label>
                  <select className="input bg-white" value={visionType} onChange={e => setVisionType(e.target.value)}>
                    <option value="">Select vision type (optional)</option>
                    {VISION_TYPES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Lens Material</label>
                  <select className="input bg-white" value={lensType} onChange={e => setLensType(e.target.value)}>
                    <option value="">Select lens type (optional)</option>
                    {LENS_TYPES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                {prescriptions.length > 0 && (
                  <div>
                    <label className="label">Use Saved Prescription</label>
                    <select className="input bg-white" value={prescId} onChange={e => setPrescId(e.target.value)}>
                      <option value="">Select prescription / will provide at store</option>
                      {prescriptions.map(rx => (
                        <option key={rx.id} value={rx.id}>{rx.vision_type} — {new Date(rx.created_at).toLocaleDateString('en-IN')}</option>
                      ))}
                    </select>
                  </div>
                )}
                {!prescId && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
                    💡 No prescription selected — our optician will contact you or you can visit the store for eye measurement.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label className="label">Special Instructions (optional)</label>
            <textarea className="input resize-none" rows="3" placeholder="Any special requirements or notes for your order…" value={instructions} onChange={e => setInstructions(e.target.value)}/>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{total.toLocaleString()}</span></div>
              {discountPct > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Your Discount ({discountPct}%)</span>
                  <span>−₹{discountAmt.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500"><span>Delivery</span><span className="text-green-600">Free</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span><span>₹{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {discountPct > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700 mb-4">
                🎉 You save ₹{discountAmt.toLocaleString()} with your {discountPct}% loyalty discount!
              </div>
            )}

            <button onClick={placeOrder} disabled={placing} className="btn-gold w-full py-3 text-base">
              {placing ? 'Placing Order…' : 'Place Order →'}
            </button>
            <Link to="/shop" className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-3">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
