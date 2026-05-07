import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'

const EMPTY_RX = { right_sph:'', right_cyl:'', right_axis:'', right_add:'', left_sph:'', left_cyl:'', left_axis:'', left_add:'', pd_distance:'', pd_near:'', add_vision_right:'', add_vision_left:'', vision_type:'Single Vision', doctor_name:'', power_source:'Shop', notes:'' }

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('info')
  const [rxForm, setRxForm] = useState({ ...EMPTY_RX })
  const [showRxForm, setShowRxForm] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCust, setNewCust] = useState({ title:'Mr', name:'', email:'', phone:'', address:'', age:'', gender:'', discount:0, notes:'' })
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({})

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(r => setCustomers(r.data)).finally(() => setLoading(false))
  }, [search])

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  const openCustomer = async (c) => {
    setSelected(c)
    setTab('info')
    setEditData({ ...c })
    const [rxRes, ordRes] = await Promise.all([
      api.get(`/prescriptions/customer/${c.id}`),
      api.get('/orders').then(r => ({ data: r.data.filter(o => o.user_id === c.id) }))
    ])
    setPrescriptions(rxRes.data)
    setOrders(ordRes.data)
  }

  const saveEdit = async () => {
    await api.put(`/customers/${selected.id}`, editData)
    setEditMode(false)
    load()
    setSelected({ ...editData })
  }

  const deleteCustomer = async (id) => {
    if (!confirm('Delete this customer? This cannot be undone.')) return
    await api.delete(`/customers/${id}`)
    setSelected(null)
    load()
  }

  const addRx = async (e) => {
    e.preventDefault()
    await api.post('/prescriptions', { ...rxForm, user_id: selected.id })
    const rx = await api.get(`/prescriptions/customer/${selected.id}`)
    setPrescriptions(rx.data)
    setShowRxForm(false)
    setRxForm({ ...EMPTY_RX })
  }

  const deleteRx = async (id) => {
    if (!confirm('Delete this prescription?')) return
    await api.delete(`/prescriptions/${id}`)
    setPrescriptions(p => p.filter(x => x.id !== id))
  }

  const addCustomer = async (e) => {
    e.preventDefault()
    await api.post('/customers', newCust)
    setShowAddCustomer(false)
    setNewCust({ title:'Mr', name:'', email:'', phone:'', address:'', age:'', gender:'', discount:0, notes:'' })
    load()
  }

  const setRx = k => e => setRxForm(p => ({ ...p, [k]: e.target.value }))
  const setEdit = k => e => setEditData(p => ({ ...p, [k]: e.target.value }))
  const setNC = k => e => setNewCust(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="flex gap-5 h-full">
      {/* List */}
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 xl:w-96 flex-shrink-0`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/></svg>
            <input className="input pl-9 text-sm" placeholder="Search by name, phone, email, address…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowAddCustomer(true)} className="btn-primary py-2 px-3 text-sm whitespace-nowrap">+ Add</button>
        </div>

        {loading ? <p className="text-gray-400 text-sm text-center py-8">Loading…</p> : (
          <div className="space-y-2 overflow-y-auto flex-1">
            {customers.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No customers found</p>}
            {customers.map(c => (
              <button key={c.id} onClick={() => openCustomer(c)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${selected?.id === c.id ? 'bg-navy-50 border-navy-300' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 font-bold text-sm flex-shrink-0">
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{c.title} {c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.phone || c.email}</p>
                  </div>
                  {c.discount > 0 && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{c.discount}% off</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="flex-1 card p-5 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <button className="lg:hidden mr-1 text-gray-500 hover:text-gray-700" onClick={() => setSelected(null)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 text-xl font-bold">
                {selected.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg text-gray-900">{selected.title} {selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditMode(!editMode)} className="btn-secondary py-1.5 px-3 text-sm">
                {editMode ? 'Cancel' : 'Edit'}
              </button>
              <button onClick={() => deleteCustomer(selected.id)} className="text-red-500 hover:text-red-700 p-1.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
            {['info','prescriptions','orders'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${tab===t ? 'bg-white shadow-sm text-navy-800' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>
            ))}
          </div>

          {/* Info tab */}
          {tab === 'info' && (
            editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Title</label><select className="input" value={editData.title||''} onChange={setEdit('title')}><option>Mr</option><option>Mrs</option><option>Ms</option><option>Miss</option><option>Master</option><option>Dr</option></select></div>
                  <div><label className="label">Name</label><input className="input" value={editData.name||''} onChange={setEdit('name')}/></div>
                  <div><label className="label">Email</label><input className="input" value={editData.email||''} onChange={setEdit('email')}/></div>
                  <div><label className="label">Phone</label><input className="input" value={editData.phone||''} onChange={setEdit('phone')}/></div>
                  <div><label className="label">Age</label><input className="input" type="number" value={editData.age||''} onChange={setEdit('age')}/></div>
                  <div><label className="label">Gender</label><select className="input" value={editData.gender||''} onChange={setEdit('gender')}><option value="">-</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                  <div><label className="label">Discount %</label><input className="input" type="number" min="0" max="100" value={editData.discount||0} onChange={setEdit('discount')}/></div>
                </div>
                <div><label className="label">Address</label><textarea className="input resize-none" rows="2" value={editData.address||''} onChange={setEdit('address')}/></div>
                <div><label className="label">Internal Notes</label><textarea className="input resize-none" rows="2" value={editData.notes||''} onChange={setEdit('notes')}/></div>
                <button onClick={saveEdit} className="btn-primary">Save Changes</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {[['Phone', selected.phone], ['Email', selected.email], ['Age', selected.age], ['Gender', selected.gender], ['Discount', selected.discount ? `${selected.discount}%` : 'None'], ['Address', selected.address], ['Notes', selected.notes], ['Joined', new Date(selected.created_at).toLocaleDateString('en-IN')]].map(([k,v]) => v && (
                  <div key={k}>
                    <span className="text-gray-400 text-xs uppercase tracking-wide">{k}</span>
                    <p className="text-gray-800 font-medium mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Prescriptions tab */}
          {tab === 'prescriptions' && (
            <div className="space-y-4">
              <button onClick={() => setShowRxForm(!showRxForm)} className="btn-primary text-sm py-2">
                {showRxForm ? '✕ Cancel' : '+ Add Prescription'}
              </button>

              {showRxForm && (
                <form onSubmit={addRx} className="card p-4 space-y-3 bg-gray-50 border">
                  <h4 className="font-medium text-sm text-gray-700">New Prescription</h4>
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full">
                      <thead><tr className="bg-navy-800 text-white"><th className="p-2">Eye</th><th className="p-2">SPH</th><th className="p-2">CYL</th><th className="p-2">AXIS</th><th className="p-2">ADD</th></tr></thead>
                      <tbody>
                        <tr className="bg-white">
                          <td className="p-1 font-medium text-center">OD (Right)</td>
                          {['right_sph','right_cyl','right_axis','right_add'].map(f => <td key={f} className="p-1"><input className="input py-1 text-xs text-center" placeholder="-" value={rxForm[f]} onChange={setRx(f)}/></td>)}
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="p-1 font-medium text-center">OS (Left)</td>
                          {['left_sph','left_cyl','left_axis','left_add'].map(f => <td key={f} className="p-1"><input className="input py-1 text-xs text-center" placeholder="-" value={rxForm[f]} onChange={setRx(f)}/></td>)}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="label text-xs">PD Distance</label><input className="input py-1 text-sm" value={rxForm.pd_distance} onChange={setRx('pd_distance')}/></div>
                    <div><label className="label text-xs">PD Right</label><input className="input py-1 text-sm" value={rxForm.add_vision_right} onChange={setRx('add_vision_right')}/></div>
                    <div><label className="label text-xs">PD Left</label><input className="input py-1 text-sm" value={rxForm.add_vision_left} onChange={setRx('add_vision_left')}/></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div><label className="label text-xs">Vision Type</label>
                      <select className="input py-1 text-sm" value={rxForm.vision_type} onChange={setRx('vision_type')}>
                        {['Single Vision','Progressive','Bifocal','Trifocal','Tinted','Photochromic','Blue Cut'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div><label className="label text-xs">Doctor Name</label><input className="input py-1 text-sm" placeholder="Dr. ..." value={rxForm.doctor_name} onChange={setRx('doctor_name')}/></div>
                    <div><label className="label text-xs">Power From</label>
                      <select className="input py-1 text-sm" value={rxForm.power_source} onChange={setRx('power_source')}>
                        {['Shop','External Doctor','Self-Provided','Other'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label className="label text-xs">Notes</label><textarea className="input text-sm resize-none" rows="2" value={rxForm.notes} onChange={setRx('notes')}/></div>
                  <button type="submit" className="btn-primary text-sm py-2">Save Prescription</button>
                </form>
              )}

              {prescriptions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No prescriptions recorded yet</p>
              ) : (
                prescriptions.map(rx => <PrescriptionCard key={rx.id} rx={rx} onDelete={() => deleteRx(rx.id)} />)
              )}
            </div>
          )}

          {/* Orders tab */}
          {tab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No orders found</p>
              ) : orders.map(o => (
                <div key={o.id} className="border rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-gray-500">Order #{o.id}</span>
                    <span className={`badge-${o.status}`}>{o.status}</span>
                  </div>
                  <p className="font-bold text-gray-800">₹{o.total_amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(o.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-lg">Add Customer</h3>
              <button onClick={() => setShowAddCustomer(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={addCustomer} className="space-y-3">
              <div className="flex gap-3">
                <div className="w-28"><label className="label">Title</label><select className="input" value={newCust.title} onChange={setNC('title')}><option>Mr</option><option>Mrs</option><option>Ms</option><option>Miss</option><option>Master</option><option>Dr</option></select></div>
                <div className="flex-1"><label className="label">Full Name *</label><input className="input" required value={newCust.name} onChange={setNC('name')}/></div>
              </div>
              <div><label className="label">Email *</label><input className="input" type="email" required value={newCust.email} onChange={setNC('email')}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Phone</label><input className="input" value={newCust.phone} onChange={setNC('phone')}/></div>
                <div><label className="label">Age</label><input className="input" type="number" value={newCust.age} onChange={setNC('age')}/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Gender</label><select className="input" value={newCust.gender} onChange={setNC('gender')}><option value="">-</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                <div><label className="label">Discount %</label><input className="input" type="number" min="0" max="100" value={newCust.discount} onChange={setNC('discount')}/></div>
              </div>
              <div><label className="label">Address</label><textarea className="input resize-none" rows="2" value={newCust.address} onChange={setNC('address')}/></div>
              <div><label className="label">Notes</label><textarea className="input resize-none" rows="2" value={newCust.notes} onChange={setNC('notes')}/></div>
              <p className="text-xs text-gray-400">Default password: <span className="font-mono font-medium">Netra@123</span></p>
              <button type="submit" className="btn-primary w-full">Add Customer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function PrescriptionCard({ rx, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-xl overflow-hidden">
      <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 text-left" onClick={() => setOpen(!open)}>
        <div>
          <span className="font-medium text-sm text-gray-800">{rx.vision_type}</span>
          <span className="text-xs text-gray-400 ml-3">{new Date(rx.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
          {rx.power_source !== 'Shop' && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">External RX</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="text-red-400 hover:text-red-600 p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
        </div>
      </button>
      {open && (
        <div className="p-4 space-y-3 bg-white">
          <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead><tr className="bg-navy-800 text-white text-center"><th className="p-2">Eye</th><th className="p-2">SPH</th><th className="p-2">CYL</th><th className="p-2">AXIS</th><th className="p-2">ADD</th></tr></thead>
              <tbody>
                <tr className="text-center border-b">
                  <td className="p-2 font-medium bg-gray-50">OD (Right)</td>
                  {[rx.right_sph, rx.right_cyl, rx.right_axis, rx.right_add].map((v,i) => <td key={i} className="p-2">{v||'—'}</td>)}
                </tr>
                <tr className="text-center">
                  <td className="p-2 font-medium bg-gray-50">OS (Left)</td>
                  {[rx.left_sph, rx.left_cyl, rx.left_axis, rx.left_add].map((v,i) => <td key={i} className="p-2">{v||'—'}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[['PD Dist.', rx.pd_distance], ['PD Right', rx.add_vision_right], ['PD Left', rx.add_vision_left]].map(([k,v]) => (
              <div key={k} className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-gray-400">{k}</div>
                <div className="font-medium">{v||'—'}</div>
              </div>
            ))}
          </div>
          {rx.doctor_name && <p className="text-xs text-gray-500">Doctor: <span className="font-medium">{rx.doctor_name}</span></p>}
          {rx.power_source && <p className="text-xs text-gray-500">Power from: <span className="font-medium">{rx.power_source}</span></p>}
          {rx.notes && <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">{rx.notes}</p>}
        </div>
      )}
    </div>
  )
}
