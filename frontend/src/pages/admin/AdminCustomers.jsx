import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'

export default function AdminCustomers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCust, setNewCust] = useState({
    title: 'Mr', full_name: '', phone: '', email: '', address: '', age: '', gender: '', discount: 0, notes: ''
  })

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      .then(r => setCustomers(r.data))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  const addCustomer = async (e) => {
    e.preventDefault()
    try {
      await api.post('/customers', newCust)
      setShowAddCustomer(false)
      setNewCust({ title:'Mr', full_name:'', phone:'', email:'', address:'', age:'', gender:'', discount:0, notes:'' })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add customer')
    }
  }

  const deleteCustomer = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this customer? This cannot be undone.')) return
    await api.delete(`/customers/${id}`)
    load()
  }

  const setNC = k => e => setNewCust(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="space-y-5">
      {/* Search + Add */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <input
            className="input pl-9 text-sm"
            placeholder="Search by name, phone, email, address…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setShowAddCustomer(true)} className="btn-primary py-2 px-4 text-sm whitespace-nowrap">
          + Add Customer
        </button>
      </div>

      {/* Customer List */}
      {loading ? (
        <p className="text-gray-400 text-sm text-center py-12">Loading…</p>
      ) : customers.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-12">No customers found</p>
      ) : (
        <div className="space-y-2">
          {customers.map(c => (
            <button
              key={c.id}
              onClick={() => navigate(`/admin/customers/${c.id}`)}
              className="w-full text-left p-4 rounded-xl border bg-white border-gray-100 hover:bg-navy-50 hover:border-navy-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 font-bold text-sm flex-shrink-0">
                  {c.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-gray-800">{c.title} {c.full_name}</p>
                    {c.discount > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{c.discount}% off</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {c.phone}{c.email ? ` · ${c.email}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => deleteCustomer(c.id, e)}
                    className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-lg">Add Customer</h3>
              <button onClick={() => setShowAddCustomer(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={addCustomer} className="space-y-3">
              <div className="flex gap-3">
                <div className="w-28">
                  <label className="label">Title</label>
                  <select className="input" value={newCust.title} onChange={setNC('title')}>
                    {['Mr','Mrs','Ms','Miss','Master','Dr'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="label">Full Name *</label>
                  <input className="input" required value={newCust.full_name} onChange={setNC('full_name')}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone *</label>
                  <input className="input" required value={newCust.phone} onChange={setNC('phone')}/>
                </div>
                <div>
                  <label className="label">Age</label>
                  <input className="input" type="number" value={newCust.age} onChange={setNC('age')}/>
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={newCust.email} onChange={setNC('email')}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Gender</label>
                  <select className="input" value={newCust.gender} onChange={setNC('gender')}>
                    <option value="">—</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Discount %</label>
                  <input className="input" type="number" min="0" max="100" value={newCust.discount} onChange={setNC('discount')}/>
                </div>
              </div>
              <div>
                <label className="label">Address</label>
                <textarea className="input resize-none" rows="2" value={newCust.address} onChange={setNC('address')}/>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input resize-none" rows="2" value={newCust.notes} onChange={setNC('notes')}/>
              </div>
              <button type="submit" className="btn-primary w-full">Add Customer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
