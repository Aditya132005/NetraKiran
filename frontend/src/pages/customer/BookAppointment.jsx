import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

const TIME_SLOTS = ['10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM','05:30 PM','06:00 PM','06:30 PM','07:00 PM','07:30 PM']

function getMinDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function BookAppointment() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user ? `${user.title || ''} ${user.name}`.trim() : '',
    phone: user?.phone || '',
    email: user?.email || '',
    date: '',
    time: '',
    notes: '',
  })
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!form.time) return setError('Please select a time slot')
    setLoading(true)
    try {
      await api.post('/appointments', { ...form, user_id: user?.id || null })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">📅</div>
        <h2 className="font-heading text-3xl font-bold text-navy-900 mb-3">Appointment Booked!</h2>
        <p className="text-gray-500 mb-2">We've received your appointment request for <strong>{form.date}</strong> at <strong>{form.time}</strong>.</p>
        <p className="text-sm text-gray-400 mb-8">Our team will confirm shortly. For urgent queries call <a href="tel:07011295507" className="text-navy-700 font-medium">070112 95507</a>.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/" className="btn-primary">Back to Home</Link>
          <Link to="/shop" className="btn-secondary">Browse Products</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Info */}
        <div className="lg:col-span-2">
          <h1 className="font-heading text-3xl font-bold text-navy-900 mb-3">Book an Appointment</h1>
          <p className="text-gray-500 mb-6">Schedule a free eye check-up or consultation at NetraKiran.</p>

          <div className="space-y-4">
            {[
              { icon:'🔬', title:'Free Eye Check', desc:'Comprehensive eye examination by our expert optician at no charge' },
              { icon:'👓', title:'Frame Fitting', desc:'Try on frames and get expert advice on the perfect fit for your face' },
              { icon:'📋', title:'Prescription Check', desc:'Get your latest prescription and compare with your current glasses' },
              { icon:'💬', title:'Expert Consultation', desc:'Discuss your vision needs and explore the best solutions for you' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <span className="text-2xl mt-0.5">{icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
                  <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-navy-50 border border-navy-100 rounded-xl">
            <h4 className="font-semibold text-navy-900 mb-2 text-sm">Store Location</h4>
            <p className="text-xs text-navy-700 leading-relaxed mb-2">LGF/3, Retailx Shopping Complex, Near Sophia Apartment, Abhay Khand-3, Indirapuram, Ghaziabad 201010</p>
            <p className="text-xs text-navy-700 mb-3">📞 <a href="tel:07011295507" className="font-medium">070112 95507</a></p>
            <p className="text-xs text-navy-600">⏰ Open: 10:00 AM – 8:00 PM (Mon–Sun)</p>
            <a href="https://maps.app.goo.gl/pSrvNAzrKFApMMeN6" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-gold-600 hover:text-gold-700 font-medium mt-2">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              View on Google Maps →
            </a>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            <h3 className="font-heading font-semibold text-xl text-navy-900 mb-5">Your Details</h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" required placeholder="Your full name" value={form.name} onChange={set('name')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone Number *</label>
                  <input className="input" required type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
                </div>
                <div>
                  <label className="label">Email (optional)</label>
                  <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} />
                </div>
              </div>

              <div>
                <label className="label">Preferred Date *</label>
                <input className="input" type="date" required min={getMinDate()} value={form.date} onChange={set('date')} />
              </div>

              <div>
                <label className="label">Preferred Time Slot *</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
                  {TIME_SLOTS.map(slot => (
                    <button key={slot} type="button" onClick={() => setForm(p => ({ ...p, time: slot }))}
                      className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all ${form.time === slot ? 'bg-navy-800 text-white border-navy-800' : 'bg-white text-gray-600 border-gray-200 hover:border-navy-400 hover:text-navy-700'}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Additional Notes (optional)</label>
                <textarea className="input resize-none" rows="3" placeholder="Any specific concerns, current glasses prescription, or other details…" value={form.notes} onChange={set('notes')} />
              </div>

              <button type="submit" disabled={loading || !form.time} className="btn-gold w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Booking…' : '📅 Confirm Appointment'}
              </button>

              {!user && (
                <p className="text-xs text-gray-400 text-center">
                  <Link to="/login" className="text-navy-700 font-medium hover:underline">Login</Link> to track your appointment online
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
