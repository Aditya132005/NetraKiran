import { useState, useEffect } from 'react'
import api from '../../utils/api'

const BADGE = { pending:'badge-pending', confirmed:'badge-confirmed', completed:'badge-completed', cancelled:'badge-cancelled' }
const STATUSES = ['all','pending','confirmed','completed','cancelled']

export default function AdminAppointments() {
  const [appts, setAppts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/appointments').then(r => setAppts(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = filter === 'all' ? appts : appts.filter(a => a.status === filter)

  const update = async () => {
    await api.put(`/appointments/${selected.id}`, { status: newStatus, notes })
    load()
    setSelected(null)
  }

  const del = async (id) => {
    if (!confirm('Delete this appointment?')) return
    await api.delete(`/appointments/${id}`)
    load()
    setSelected(null)
  }

  const today = new Date().toISOString().split('T')[0]
  const todayAppts = appts.filter(a => a.date === today)

  return (
    <div className="space-y-5">
      {/* Today Banner */}
      {todayAppts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <p className="font-semibold text-amber-800">{todayAppts.length} appointment{todayAppts.length>1?'s':''} today</p>
            <p className="text-sm text-amber-600">{todayAppts.map(a=>a.name).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm capitalize transition-colors border ${filter===s ? 'bg-navy-800 text-white border-navy-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {s}
            <span className="ml-1.5 text-xs opacity-70">({s==='all'?appts.length:appts.filter(a=>a.status===s).length})</span>
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-400 text-sm text-center py-12">Loading…</p> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Name','Phone','Email','Date','Time','Status','Notes','Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" className="px-4 py-12 text-center text-gray-400">No appointments found</td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id} className={`hover:bg-gray-50 ${a.date===today ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{a.name}</td>
                    <td className="px-4 py-3 text-gray-500">{a.phone}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{a.email||'—'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(a.date+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.time}</td>
                    <td className="px-4 py-3"><span className={BADGE[a.status]||'badge bg-gray-100 text-gray-600'}>{a.status}</span></td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-32 truncate">{a.notes||'—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelected(a); setNewStatus(a.status); setNotes(a.notes||'') }}
                        className="text-navy-700 hover:text-navy-900 text-xs font-medium">Manage →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manage Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-lg">Manage Appointment</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-2 mb-5 p-4 bg-gray-50 rounded-xl text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Patient</span><span className="font-medium">{selected.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Phone</span><span className="font-medium">{selected.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Date & Time</span><span className="font-medium">{selected.date} · {selected.time}</span></div>
              {selected.email && <div className="flex justify-between"><span className="text-gray-400">Email</span><span className="font-medium">{selected.email}</span></div>}
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Update Status</label>
                <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input resize-none" rows="3" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about the appointment…"/>
              </div>
              <div className="flex gap-3">
                <button onClick={update} className="btn-primary flex-1 text-sm py-2">Save Changes</button>
                <button onClick={() => del(selected.id)} className="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
