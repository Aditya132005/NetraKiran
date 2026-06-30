import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title:'Mr', name:'', email:'', phone:'', address:'', age:'', gender:'', password:'', confirm:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      await signup(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-navy-800 rounded-2xl flex items-center justify-center text-white font-heading font-bold text-xl mx-auto mb-4">NK</div>
            <h1 className="font-heading text-2xl font-bold text-navy-900">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Join NetraKiran family</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title + Name */}
            <div className="flex gap-3">
              <div className="w-28">
                <label className="label">Title</label>
                <select className="input" value={form.title} onChange={set('title')}>
                  <option>Mr</option><option>Mrs</option><option>Ms</option>
                  <option>Miss</option><option>Master</option><option>Dr</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="label">Full Name *</label>
                <input className="input" placeholder="Your full name" value={form.name} onChange={set('name')} required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email Address *</label>
              <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required />
            </div>

            {/* Phone + Age */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Phone Number</label>
                <input className="input" type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
              </div>
              <div>
                <label className="label">Age</label>
                <input className="input" type="number" placeholder="25" min="1" max="120" value={form.age} onChange={set('age')} />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Address */}
            <div>
              <label className="label">Address</label>
              <textarea className="input resize-none" rows="2" placeholder="Your full address" value={form.address} onChange={set('address')} />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Password *</label>
                <input className="input" type="password" placeholder="Min 6 chars" value={form.password} onChange={set('password')} required />
              </div>
              <div>
                <label className="label">Confirm Password *</label>
                <input className="input" type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-center py-3 text-base mt-2">
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-navy-700 font-medium hover:text-navy-900">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
