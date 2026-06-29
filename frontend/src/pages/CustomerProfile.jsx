import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'

const TITLES = ['Mr', 'Mrs', 'Ms', 'Master', 'Doctor', 'Er.', 'Prof.']

export default function CustomerProfile() {
  const { id } = useParams()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/customer-profiles/${id}`)
      setCustomer(data)
      setForm({
        title: data.title || '',
        full_name: data.full_name || '',
        phone: data.phone || '',
        email: data.email || '',
        age: data.age || '',
        gender: data.gender || '',
        address: data.address || '',
        discount: data.discount || 0,
        notes: data.notes || '',
      })
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const saveEdit = async e => {
    e.preventDefault()
    setSaveError('')
    setSaving(true)
    try {
      await api.put(`/customer-profiles/${id}`, {
        ...form,
        age: form.age ? parseInt(form.age) : null,
        discount: form.discount ? parseFloat(form.discount) : 0,
      })
      await load()
      setEditing(false)
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-[80vh] flex items-center justify-center text-center px-4">
      <div>
        <p className="text-5xl mb-4">😕</p>
        <p className="font-semibold text-gray-700 text-lg">Customer not found</p>
        <Link to="/customer-search" className="text-navy-700 hover:text-navy-900 text-sm mt-3 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back to Search
        </Link>
      </div>
    </div>
  )

  const initials = customer.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const joinDate = new Date(customer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* Back link */}
      <Link to="/customer-search" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Search
      </Link>

      {/* ── Profile Card ── */}
      <div className="card p-6 sm:p-8 mb-6">
        {editing ? (
          /* Edit form */
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-heading font-bold text-lg text-navy-900">Edit Profile</h2>
              <button type="button" onClick={() => { setEditing(false); setSaveError('') }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {saveError}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Title</label>
                <select className="input" value={form.title} onChange={set('title')}>
                  <option value="">—</option>
                  {TITLES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Full Name *</label>
                <input className="input" required value={form.full_name} onChange={set('full_name')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Phone *</label><input className="input" required value={form.phone} onChange={set('phone')} /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Age</label>
                <input className="input" type="number" min="1" max="120" value={form.age} onChange={set('age')} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select className="input" value={form.gender} onChange={set('gender')}>
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Discount %</label>
                <input className="input" type="number" min="0" max="100" step="0.5" value={form.discount} onChange={set('discount')} />
              </div>
            </div>
            <div><label className="label">Address</label><textarea className="input resize-none" rows="2" value={form.address} onChange={set('address')} /></div>
            <div><label className="label">Notes</label><textarea className="input resize-none" rows="2" placeholder="Internal notes about this customer…" value={form.notes} onChange={set('notes')} /></div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="btn-primary py-2.5 px-6">{saving ? 'Saving…' : 'Save Changes'}</button>
              <button type="button" onClick={() => { setEditing(false); setSaveError('') }} className="btn-secondary py-2.5 px-6">Cancel</button>
            </div>
          </form>
        ) : (
          /* Profile view */
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-navy-800 flex items-center justify-center text-white font-heading font-bold text-2xl shadow-md">
                {initials}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="font-heading text-2xl font-bold text-navy-900 leading-tight">
                    {customer.title ? `${customer.title} ` : ''}{customer.full_name}
                  </h1>
                  <p className="text-sm text-gray-400 mt-0.5">Customer since {joinDate}</p>
                </div>
                <button onClick={() => setEditing(true)} className="flex-shrink-0 btn-secondary text-sm py-2 px-4">
                  Edit Info
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow icon="📱" label="Phone" value={customer.phone} />
                {customer.email && <InfoRow icon="✉️" label="Email" value={customer.email} />}
                {customer.age && <InfoRow icon="🎂" label="Age" value={`${customer.age} years`} />}
                {customer.gender && <InfoRow icon="👤" label="Gender" value={capitalize(customer.gender)} />}
                {Number(customer.discount) > 0 && (
                  <InfoRow icon="🏷️" label="Discount" value={`${customer.discount}%`} highlight />
                )}
                {customer.address && <InfoRow icon="📍" label="Address" value={customer.address} wide />}
              </div>

              {customer.notes && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
                  <span className="font-semibold">Note: </span>{customer.notes}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Prescriptions ── */}
      <div className="card p-6 sm:p-8 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-lg text-navy-900 flex items-center gap-2">
            <span>🔬</span> Prescriptions
          </h2>
          <span className="text-sm text-gray-400">{customer.prescriptions?.length || 0} record{customer.prescriptions?.length !== 1 ? 's' : ''}</span>
        </div>

        {!customer.prescriptions?.length ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📄</p>
            <p className="text-sm">No prescriptions recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customer.prescriptions.map((rx, i) => (
              <div key={rx.id} className={`border rounded-xl p-4 ${i === 0 ? 'border-navy-200 bg-navy-50' : 'border-gray-100'}`}>
                {/* Header row */}
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  {i === 0 && (
                    <span className="text-[10px] font-bold bg-navy-800 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Latest</span>
                  )}
                  {rx.prescription_type === 'contact' ? (
                    <span className="text-xs font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">Contact Lens</span>
                  ) : (
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Spectacle Lens</span>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {new Date(rx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {rx.doctor_name && (
                    <span className="text-xs text-gray-400 ml-auto">Dr. {rx.doctor_name}</span>
                  )}
                </div>

                {rx.prescription_type === 'contact' ? (
                  /* Contact lens details */
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ['Type', rx.contact_lens_type],
                      ['Disposable Schedule', rx.disposable_schedule],
                      ['Pack Quantity', rx.pack_quantity],
                      ['Number of Lenses', rx.num_lenses],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-white rounded-lg p-2.5 border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">{k}</p>
                        <p className="font-semibold text-gray-800">{v || '—'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Spectacle lens details */
                  <>
                    {rx.vision_type && (
                      <p className="text-xs text-gray-500 mb-2">{rx.vision_type}</p>
                    )}
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-xs min-w-[300px]">
                        <thead>
                          <tr className="text-[11px] text-gray-400 uppercase tracking-wider">
                            <th className="text-left pb-2 pl-1 font-medium w-24">Eye</th>
                            <th className="pb-2 text-center font-medium">SPH</th>
                            <th className="pb-2 text-center font-medium">CYL</th>
                            <th className="pb-2 text-center font-medium">AXIS</th>
                            <th className="pb-2 text-center font-medium">ADD</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono">
                          <tr className="border-t border-gray-200">
                            <td className="py-2 pl-1 text-gray-600 font-sans font-medium text-xs">Right (OD)</td>
                            <td className="text-center py-2">{rx.right_sph || '—'}</td>
                            <td className="text-center py-2">{rx.right_cyl || '—'}</td>
                            <td className="text-center py-2">{rx.right_axis || '—'}</td>
                            <td className="text-center py-2">{rx.right_add || '—'}</td>
                          </tr>
                          <tr className="border-t border-gray-100">
                            <td className="py-2 pl-1 text-gray-600 font-sans font-medium text-xs">Left (OS)</td>
                            <td className="text-center py-2">{rx.left_sph || '—'}</td>
                            <td className="text-center py-2">{rx.left_cyl || '—'}</td>
                            <td className="text-center py-2">{rx.left_axis || '—'}</td>
                            <td className="text-center py-2">{rx.left_add || '—'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {(rx.pd_distance || rx.add_vision_right || rx.add_vision_left) && (
                      <div className="flex flex-wrap gap-5 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        {rx.pd_distance && (
                          <span>PD Dist: <span className="font-mono font-semibold text-gray-700">{rx.pd_distance}</span></span>
                        )}
                        {rx.add_vision_right && (
                          <span>PD Right: <span className="font-mono font-semibold text-gray-700">{rx.add_vision_right}</span></span>
                        )}
                        {rx.add_vision_left && (
                          <span>PD Left: <span className="font-mono font-semibold text-gray-700">{rx.add_vision_left}</span></span>
                        )}
                      </div>
                    )}
                  </>
                )}

                {rx.notes && <p className="text-xs text-gray-400 mt-2 italic">{rx.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Visit History ── */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-lg text-navy-900 flex items-center gap-2">
            <span>📋</span> Visit History
          </h2>
          <span className="text-sm text-gray-400">{customer.visits?.length || 0} visit{customer.visits?.length !== 1 ? 's' : ''}</span>
        </div>

        {!customer.visits?.length ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm">No visits recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customer.visits.map(v => (
              <div key={v.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm">
                      {new Date(v.visit_date).toLocaleDateString('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                    {v.items_purchased && (
                      <p className="text-xs text-gray-500 mt-1">{v.items_purchased}</p>
                    )}
                    {v.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 italic">{v.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-4 flex-shrink-0">
                    {v.discount_given > 0 && (
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Discount</p>
                        <p className="text-sm font-semibold text-green-700">{v.discount_given}%</p>
                      </div>
                    )}
                    {v.total_amount && (
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
                        <p className="text-sm font-bold text-navy-800">₹{Number(v.total_amount).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function InfoRow({ icon, label, value, highlight, wide }) {
  return (
    <div className={`flex items-start gap-2.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="text-base mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{label}</p>
        <p className={`text-sm font-medium truncate ${highlight ? 'text-green-700' : 'text-gray-800'}`}>{value}</p>
      </div>
    </div>
  )
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}
