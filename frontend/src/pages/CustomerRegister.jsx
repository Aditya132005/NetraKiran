import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

const TITLES = ['Mr', 'Mrs', 'Ms', 'Master', 'Doctor', 'Er.', 'Prof.']

export default function CustomerRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', full_name: '', phone: '', email: '',
    age: '', gender: '', address: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!form.full_name.trim()) return setError('Full name is required')
    if (!form.phone.trim()) return setError('Phone number is required')
    if (!/^\d+$/.test(form.phone.trim())) return setError('Phone number must contain only digits')

    setLoading(true)
    try {
      const { data } = await api.post('/customer-profiles/register', {
        ...form,
        age: form.age ? parseInt(form.age) : null,
      })
      navigate(`/customer/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <Link to="/customer-search" className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy-900">Register Customer</h1>
            <p className="text-sm text-gray-500">Add a new customer profile</p>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title + Name */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Title</label>
                <select className="input" value={form.title} onChange={set('title')}>
                  <option value="">—</option>
                  {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <input className="input" placeholder="Patient's full name" value={form.full_name} onChange={set('full_name')} required />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="label">Phone Number <span className="text-red-500">*</span></label>
              <input
                className="input"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={set('phone')}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="label">Email <span className="text-gray-400 font-normal">(optional)</span></label>
              <input className="input" type="email" placeholder="email@example.com" value={form.email} onChange={set('email')} />
            </div>

            {/* Age + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Age <span className="text-gray-400 font-normal">(optional)</span></label>
                <input className="input" type="number" placeholder="Age in years" min="1" max="120" value={form.age} onChange={set('age')} />
              </div>
              <div>
                <label className="label">Gender <span className="text-gray-400 font-normal">(optional)</span></label>
                <select className="input" value={form.gender} onChange={set('gender')}>
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="label">Address <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                className="input resize-none"
                rows="2"
                placeholder="Home or billing address"
                value={form.address}
                onChange={set('address')}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Registering…' : 'Register Customer'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
