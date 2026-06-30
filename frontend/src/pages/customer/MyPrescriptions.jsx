import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

export default function MyPrescriptions() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get(`/prescriptions/customer/${user.id}`).then(r => setPrescriptions(r.data)).finally(() => setLoading(false))
  }, [user.id])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-navy-900">My Prescriptions</h1>
          <p className="text-gray-500 text-sm mt-1">Your eye power records from Karan Optics</p>
        </div>
        <Link to="/book-appointment" className="btn-gold text-sm py-2">Book Eye Check</Link>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Loading…</p>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">👁</div>
          <h3 className="font-semibold text-gray-700 mb-2">No prescriptions on file</h3>
          <p className="text-gray-400 text-sm mb-6">Visit Karan Optics for a comprehensive eye check-up</p>
          <Link to="/book-appointment" className="btn-primary">Book Appointment</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx, idx) => (
            <div key={rx.id} className={`card overflow-hidden ${idx === 0 ? 'border-2 border-navy-200' : ''}`}>
              <button className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors" onClick={() => setExpanded(expanded===rx.id ? null : rx.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 font-bold">
                    {idx === 0 ? '★' : idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{rx.vision_type}</span>
                      {idx === 0 && <span className="text-[10px] bg-navy-800 text-white px-2 py-0.5 rounded-full">Latest</span>}
                      {rx.power_source !== 'Shop' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">External RX</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(rx.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                      {rx.doctor_name && ` · Dr. ${rx.doctor_name}`}
                    </p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expanded===rx.id?'rotate-180':''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
              </button>

              {expanded === rx.id && (
                <div className="border-t p-5 space-y-4 bg-white">
                  {/* Prescription Table */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Eyeglass Prescription</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-navy-800 text-white">
                            <th className="p-3 text-left rounded-tl-lg">Eye</th>
                            <th className="p-3 text-center">Sphere (SPH)</th>
                            <th className="p-3 text-center">Cylinder (CYL)</th>
                            <th className="p-3 text-center">Axis</th>
                            <th className="p-3 text-center rounded-tr-lg">Add</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-3 font-medium bg-gray-50 text-gray-700">Right Eye (OD)</td>
                            <td className="p-3 text-center font-mono">{rx.right_sph || '—'}</td>
                            <td className="p-3 text-center font-mono">{rx.right_cyl || '—'}</td>
                            <td className="p-3 text-center font-mono">{rx.right_axis || '—'}</td>
                            <td className="p-3 text-center font-mono">{rx.right_add || '—'}</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium bg-gray-50 text-gray-700">Left Eye (OS)</td>
                            <td className="p-3 text-center font-mono">{rx.left_sph || '—'}</td>
                            <td className="p-3 text-center font-mono">{rx.left_cyl || '—'}</td>
                            <td className="p-3 text-center font-mono">{rx.left_axis || '—'}</td>
                            <td className="p-3 text-center font-mono">{rx.left_add || '—'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* PD and Add Vision */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['PD Distance', rx.pd_distance],
                      ['PD Right', rx.add_vision_right],
                      ['PD Left', rx.add_vision_left],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        <p className="font-mono font-medium text-gray-800">{value || '—'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-400 text-xs uppercase">Vision Type</span><p className="font-medium mt-0.5">{rx.vision_type}</p></div>
                    {rx.doctor_name && <div><span className="text-gray-400 text-xs uppercase">Doctor</span><p className="font-medium mt-0.5">{rx.doctor_name}</p></div>}
                    {rx.power_source && <div><span className="text-gray-400 text-xs uppercase">Prescription From</span><p className="font-medium mt-0.5">{rx.power_source}</p></div>}
                  </div>

                  {rx.notes && (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                      <p className="text-xs text-yellow-700 font-medium mb-0.5">Notes</p>
                      <p className="text-sm text-yellow-800">{rx.notes}</p>
                    </div>
                  )}

                  <Link to="/shop" className="inline-flex items-center gap-2 btn-primary text-sm py-2">
                    <span>🛍️</span> Shop with this prescription
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
