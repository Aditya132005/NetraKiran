import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'

const EMPTY_RX_ROW = { right_sph:'', right_cyl:'', right_axis:'', left_sph:'', left_cyl:'', left_axis:'' }

const EMPTY_CHALLAN = {
  visit_date: '',
  vision_type: 'Single Vision',
  dv: { ...EMPTY_RX_ROW },
  nv: { ...EMPTY_RX_ROW },
  frame_name: '', frame_mrp: '', frame_discount: '',
  lens_name: '', lens_mrp: '', lens_discount: '',
  advance: '', notes: ''
}

function todayDatetimeLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function toDatetimeLocal(val) {
  if (!val) return todayDatetimeLocal()
  const d = new Date(val)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function formatPhoneForWhatsApp(phone) {
  let digits = (phone || '').replace(/[\s\-+]/g, '')
  if (!digits.startsWith('91')) digits = `91${digits}`
  return digits
}

function calcChallanTotals({ frame_mrp, frame_discount, lens_mrp, lens_discount, advance }) {
  const total = (Number(frame_mrp) || 0) + (Number(lens_mrp) || 0)
    - (Number(frame_discount) || 0) - (Number(lens_discount) || 0)
  const balance = total - (Number(advance) || 0)
  return { total, balance }
}

function rupees(n) {
  return `₹${(Number(n) || 0).toLocaleString('en-IN')}`
}

function buildChallanMessage(challan, customer) {
  const date = new Date(challan.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const patient = `${customer?.title ? customer.title + ' ' : ''}${customer?.full_name || 'Customer'}`
  const dv = challan.dv || {}
  const nv = challan.nv || {}
  const g = (obj, f) => obj[f] || '—'
  const total = challan.total_amount != null ? Number(challan.total_amount) : calcChallanTotals(challan).total
  const advance = Number(challan.advance) || 0
  const balance = challan.balance != null ? Number(challan.balance) : total - advance

  let msg = `*NetraKiran Optics*
LGF/3, Retailx Shopping Complex, Abhay Khand-3, Indirapuram
📞 7011295507

*Customer:* ${patient}
*Date:* ${date}

*PRESCRIPTION*
|      | RIGHT |     |      | LEFT |     |      |
|      | Sph   | Cyl | Axis | Sph  | Cyl | Axis |
| D.V. | ${g(dv,'right_sph')} | ${g(dv,'right_cyl')} | ${g(dv,'right_axis')} | ${g(dv,'left_sph')} | ${g(dv,'left_cyl')} | ${g(dv,'left_axis')} |
| N.V. | ${g(nv,'right_sph')} | ${g(nv,'right_cyl')} | ${g(nv,'right_axis')} | ${g(nv,'left_sph')} | ${g(nv,'left_cyl')} | ${g(nv,'left_axis')} |

*Frame:* ${challan.frame_name || '—'}  MRP: ${rupees(challan.frame_mrp)}  Disc: ${rupees(challan.frame_discount)}
*Lens:* ${challan.lens_name || '—'}  MRP: ${rupees(challan.lens_mrp)}  Disc: ${rupees(challan.lens_discount)}
*Total:* ${rupees(total)}
*Advance:* ${rupees(advance)}
*Balance:* ${rupees(balance)}`

  if (challan.notes) msg += `\n\n${challan.notes}`
  return msg
}

function sendChallanOnWhatsApp(challan, customer) {
  const phone = formatPhoneForWhatsApp(customer?.phone)
  const message = buildChallanMessage(challan, customer)
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

export default function AdminCustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)

  const [editInfo, setEditInfo] = useState(false)
  const [infoForm, setInfoForm] = useState({})
  const [savingInfo, setSavingInfo] = useState(false)

  const [showChallanForm, setShowChallanForm] = useState(false)
  const [challanForm, setChallanForm] = useState({ ...EMPTY_CHALLAN, visit_date: todayDatetimeLocal() })
  const [editingChallanId, setEditingChallanId] = useState(null)
  const [savingChallan, setSavingChallan] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get(`/customer-profiles/${id}`)
      setCustomer(data)
      setInfoForm({
        title: data.title || '',
        full_name: data.full_name || '',
        phone: data.phone || '',
        email: data.email || '',
        age: data.age || '',
        gender: data.gender || '',
        address: data.address || '',
        discount: data.discount || 0,
        notes: data.notes || ''
      })
      setPrescriptions(data.prescriptions || [])
      setVisits(data.visits || [])
    } catch {
      navigate('/admin/customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const saveInfo = async () => {
    setSavingInfo(true)
    try {
      await api.put(`/customer-profiles/${id}`, infoForm)
      setCustomer(prev => ({ ...prev, ...infoForm }))
      setEditInfo(false)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save customer info')
    } finally {
      setSavingInfo(false)
    }
  }

  // ── Challan History ────────────────────────────────────────────────

  const challans = visits.map(v => ({
    ...v,
    dv: prescriptions.find(p => p.visit_id === v.id && p.vision_row === 'DV') || null,
    nv: prescriptions.find(p => p.visit_id === v.id && p.vision_row === 'NV') || null,
  }))

  const openAddChallan = () => {
    setChallanForm({ ...EMPTY_CHALLAN, visit_date: todayDatetimeLocal() })
    setEditingChallanId(null)
    setShowChallanForm(true)
  }

  const openEditChallan = (challan) => {
    const isLegacy = !challan.frame_name && !challan.lens_name && !challan.frame_mrp && !challan.lens_mrp
    setChallanForm({
      visit_date: toDatetimeLocal(challan.visit_date),
      vision_type: challan.dv?.vision_type || challan.nv?.vision_type || 'Single Vision',
      dv: challan.dv ? {
        right_sph: challan.dv.right_sph || '', right_cyl: challan.dv.right_cyl || '', right_axis: challan.dv.right_axis || '',
        left_sph: challan.dv.left_sph || '', left_cyl: challan.dv.left_cyl || '', left_axis: challan.dv.left_axis || ''
      } : { ...EMPTY_RX_ROW },
      nv: challan.nv ? {
        right_sph: challan.nv.right_sph || '', right_cyl: challan.nv.right_cyl || '', right_axis: challan.nv.right_axis || '',
        left_sph: challan.nv.left_sph || '', left_cyl: challan.nv.left_cyl || '', left_axis: challan.nv.left_axis || ''
      } : { ...EMPTY_RX_ROW },
      frame_name: challan.frame_name || (isLegacy ? (challan.items_purchased || '') : ''),
      frame_mrp: challan.frame_mrp ?? (isLegacy ? (challan.total_amount ?? '') : ''),
      frame_discount: challan.frame_discount ?? '',
      lens_name: challan.lens_name || '',
      lens_mrp: challan.lens_mrp ?? '',
      lens_discount: challan.lens_discount ?? '',
      advance: challan.advance ?? '',
      notes: challan.notes || ''
    })
    setEditingChallanId(challan.id)
    setShowChallanForm(true)
  }

  const closeChallanForm = () => {
    setShowChallanForm(false)
    setEditingChallanId(null)
    setChallanForm({ ...EMPTY_CHALLAN, visit_date: todayDatetimeLocal() })
  }

  const saveChallan = async (e) => {
    e.preventDefault()
    setSavingChallan(true)
    const payload = { ...challanForm }
    try {
      if (editingChallanId) {
        const { data } = await api.put(`/customer-profiles/visits/${editingChallanId}`, payload)
        setVisits(prev => prev.map(v => v.id === editingChallanId ? data : v))
        setPrescriptions(prev => [
          ...prev.filter(p => p.visit_id !== editingChallanId),
          ...(data.prescriptions || [])
        ])
      } else {
        const { data } = await api.post(`/customer-profiles/${id}/visits`, payload)
        setVisits(prev => [data, ...prev])
        setPrescriptions(prev => [...(data.prescriptions || []), ...prev])
      }
      closeChallanForm()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save challan')
    } finally {
      setSavingChallan(false)
    }
  }

  const deleteChallan = async (visitId) => {
    if (!confirm('Delete this challan record?')) return
    try {
      await api.delete(`/customer-profiles/visits/${visitId}`)
      setVisits(prev => prev.filter(v => v.id !== visitId))
      setPrescriptions(prev => prev.filter(p => p.visit_id !== visitId))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete challan')
    }
  }

  const setInfo = k => e => setInfoForm(p => ({ ...p, [k]: e.target.value }))
  const setChallan = k => e => setChallanForm(p => ({ ...p, [k]: e.target.value }))
  const setDv = f => e => setChallanForm(p => ({ ...p, dv: { ...p.dv, [f]: e.target.value } }))
  const setNv = f => e => setChallanForm(p => ({ ...p, nv: { ...p.nv, [f]: e.target.value } }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-navy-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!customer) return null

  const latestChallan = challans[0]
  const { total: formTotal, balance: formBalance } = calcChallanTotals(challanForm)

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/customers')}
          className="text-gray-500 hover:text-navy-800 transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 font-bold text-base flex-shrink-0">
          {customer.full_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl text-gray-900">{customer.title} {customer.full_name}</h1>
          <p className="text-sm text-gray-500">{customer.phone}{customer.email ? ` · ${customer.email}` : ''}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Total Visits', challans.length],
          ['Last Visit', latestChallan ? new Date(latestChallan.visit_date).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '—'],
          ['Last Total', latestChallan?.total_amount ? rupees(latestChallan.total_amount) : '—'],
          ['Last Balance', latestChallan?.balance != null ? rupees(latestChallan.balance) : '—'],
        ].map(([label, value]) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-navy-800">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Customer Info */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-base text-gray-800">Customer Info</h2>
          <button onClick={() => setEditInfo(!editInfo)} className="btn-secondary py-1.5 px-3 text-sm">
            {editInfo ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editInfo ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Title</label>
                <select className="input" value={infoForm.title} onChange={setInfo('title')}>
                  {['Mr','Mrs','Ms','Miss','Master','Dr'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="label">Full Name</label><input className="input" value={infoForm.full_name} onChange={setInfo('full_name')}/></div>
              <div><label className="label">Phone</label><input className="input" value={infoForm.phone} onChange={setInfo('phone')}/></div>
              <div><label className="label">Email</label><input className="input" type="email" value={infoForm.email} onChange={setInfo('email')}/></div>
              <div><label className="label">Age</label><input className="input" type="number" value={infoForm.age} onChange={setInfo('age')}/></div>
              <div>
                <label className="label">Gender</label>
                <select className="input" value={infoForm.gender} onChange={setInfo('gender')}>
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Discount %</label>
                <input className="input" type="number" min="0" max="100" value={infoForm.discount} onChange={setInfo('discount')}/>
              </div>
            </div>
            <div><label className="label">Address</label><textarea className="input resize-none" rows="2" value={infoForm.address} onChange={setInfo('address')}/></div>
            <div><label className="label">Notes</label><textarea className="input resize-none" rows="2" value={infoForm.notes} onChange={setInfo('notes')}/></div>
            <button onClick={saveInfo} disabled={savingInfo} className="btn-primary">
              {savingInfo ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 text-sm">
            {[
              ['Phone', customer.phone],
              ['Email', customer.email],
              ['Age', customer.age],
              ['Gender', customer.gender ? customer.gender.charAt(0).toUpperCase() + customer.gender.slice(1) : null],
              ['Discount', customer.discount ? `${customer.discount}%` : null],
              ['Address', customer.address],
              ['Notes', customer.notes],
              ['Joined', new Date(customer.created_at).toLocaleDateString('en-IN')],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <span className="text-gray-400 text-xs uppercase tracking-wide">{k}</span>
                <p className="text-gray-800 font-medium mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Challan History */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-base text-gray-800">Challan History</h2>
          <button
            onClick={showChallanForm ? closeChallanForm : openAddChallan}
            className="btn-primary py-1.5 px-3 text-sm"
          >
            {showChallanForm ? '✕ Cancel' : '+ Add Challan'}
          </button>
        </div>

        {showChallanForm && (
          <form onSubmit={saveChallan} className="card p-4 space-y-4 bg-gray-50 border mb-4">
            <h4 className="font-medium text-sm text-gray-700">
              {editingChallanId ? 'Edit Challan' : 'New Challan'}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Date & Time</label>
                <input className="input py-1 text-sm" type="datetime-local" value={challanForm.visit_date} onChange={setChallan('visit_date')} />
              </div>
              <div>
                <label className="label text-xs">Vision Type</label>
                <select className="input py-1 text-sm" value={challanForm.vision_type} onChange={setChallan('vision_type')}>
                  {['Single Vision','Bifocal','Progressive','Contact Lens'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prescription</p>
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-navy-800 text-white text-center">
                      <th className="p-2" rowSpan={2}>Vision</th>
                      <th className="p-2" colSpan={3}>Right Eye</th>
                      <th className="p-2" colSpan={3}>Left Eye</th>
                    </tr>
                    <tr className="bg-navy-700 text-white text-center">
                      <th className="p-1.5">Sph</th><th className="p-1.5">Cyl</th><th className="p-1.5">Axis</th>
                      <th className="p-1.5">Sph</th><th className="p-1.5">Cyl</th><th className="p-1.5">Axis</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="p-1 font-medium text-center">D.V.</td>
                      {['right_sph','right_cyl','right_axis','left_sph','left_cyl','left_axis'].map(f => (
                        <td key={f} className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={challanForm.dv[f]} onChange={setDv(f)}/></td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-1 font-medium text-center">N.V.</td>
                      {['right_sph','right_cyl','right_axis','left_sph','left_cyl','left_axis'].map(f => (
                        <td key={f} className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={challanForm.nv[f]} onChange={setNv(f)}/></td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Frame</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1"><label className="label text-xs">Name / Description</label><input className="input py-1 text-sm" value={challanForm.frame_name} onChange={setChallan('frame_name')}/></div>
                <div><label className="label text-xs">MRP (₹)</label><input className="input py-1 text-sm" type="number" value={challanForm.frame_mrp} onChange={setChallan('frame_mrp')}/></div>
                <div><label className="label text-xs">Discount (₹)</label><input className="input py-1 text-sm" type="number" value={challanForm.frame_discount} onChange={setChallan('frame_discount')}/></div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Lens</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1"><label className="label text-xs">Name / Description</label><input className="input py-1 text-sm" value={challanForm.lens_name} onChange={setChallan('lens_name')}/></div>
                <div><label className="label text-xs">MRP (₹)</label><input className="input py-1 text-sm" type="number" value={challanForm.lens_mrp} onChange={setChallan('lens_mrp')}/></div>
                <div><label className="label text-xs">Discount (₹)</label><input className="input py-1 text-sm" type="number" value={challanForm.lens_discount} onChange={setChallan('lens_discount')}/></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-navy-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-400">Total</p>
                <p className="font-bold text-navy-800">{rupees(formTotal)}</p>
              </div>
              <div>
                <label className="label text-xs">Advance (₹)</label>
                <input className="input py-1 text-sm" type="number" value={challanForm.advance} onChange={setChallan('advance')}/>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-400">Balance</p>
                <p className="font-bold text-green-700">{rupees(formBalance)}</p>
              </div>
            </div>

            <div><label className="label text-xs">Notes</label><textarea className="input text-sm resize-none" rows="2" value={challanForm.notes} onChange={setChallan('notes')}/></div>

            <button type="submit" disabled={savingChallan} className="btn-primary text-sm py-2">
              {savingChallan ? 'Saving…' : editingChallanId ? 'Update Challan' : 'Save Challan'}
            </button>
          </form>
        )}

        {challans.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No challans recorded yet</p>
        ) : (
          <div className="space-y-3">
            {challans.map((challan, idx) => (
              <ChallanCard
                key={challan.id}
                challan={challan}
                customer={customer}
                defaultOpen={idx === 0}
                onEdit={openEditChallan}
                onDelete={deleteChallan}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChallanCard({ challan, customer, defaultOpen = false, onEdit, onDelete }) {
  const [open, setOpen] = useState(defaultOpen)
  const hasRx = challan.dv || challan.nv
  const hasBreakdown = challan.frame_name || challan.lens_name || challan.frame_mrp || challan.lens_mrp
  const total = challan.total_amount != null ? Number(challan.total_amount) : null
  const balance = challan.balance != null ? Number(challan.balance) : null

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-800">
            {new Date(challan.visit_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
          </span>
          {challan.dv?.vision_type && <span className="text-xs bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full">{challan.dv.vision_type}</span>}
          {total != null && <span className="text-xs text-gray-500">Total: {rupees(total)}</span>}
          {balance != null && balance > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Balance: {rupees(balance)}</span>}
        </div>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="p-4 space-y-3 bg-white">
          <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="bg-navy-800 text-white text-center">
                  <th className="p-2" rowSpan={2}>Vision</th>
                  <th className="p-2" colSpan={3}>Right Eye</th>
                  <th className="p-2" colSpan={3}>Left Eye</th>
                </tr>
                <tr className="bg-navy-700 text-white text-center">
                  <th className="p-1.5">Sph</th><th className="p-1.5">Cyl</th><th className="p-1.5">Axis</th>
                  <th className="p-1.5">Sph</th><th className="p-1.5">Cyl</th><th className="p-1.5">Axis</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center border-b">
                  <td className="p-2 font-medium bg-gray-50">D.V.</td>
                  {['right_sph','right_cyl','right_axis','left_sph','left_cyl','left_axis'].map(f => (
                    <td key={f} className="p-2">{challan.dv?.[f] || '—'}</td>
                  ))}
                </tr>
                <tr className="text-center">
                  <td className="p-2 font-medium bg-gray-50">N.V.</td>
                  {['right_sph','right_cyl','right_axis','left_sph','left_cyl','left_axis'].map(f => (
                    <td key={f} className="p-2">{challan.nv?.[f] || '—'}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {!hasRx && <p className="text-xs text-gray-400 text-center">No prescription recorded for this visit</p>}

          {hasBreakdown ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-400">Frame</div>
                <div className="font-medium">{challan.frame_name || '—'}</div>
                <div className="text-gray-500 mt-0.5">MRP: {rupees(challan.frame_mrp)} · Disc: {rupees(challan.frame_discount)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-400">Lens</div>
                <div className="font-medium">{challan.lens_name || '—'}</div>
                <div className="text-gray-500 mt-0.5">MRP: {rupees(challan.lens_mrp)} · Disc: {rupees(challan.lens_discount)}</div>
              </div>
            </div>
          ) : challan.items_purchased ? (
            <div className="bg-gray-50 rounded-lg p-2 text-xs">
              <div className="text-gray-400">Items Purchased</div>
              <div className="font-medium">{challan.items_purchased}</div>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-navy-50 rounded-lg p-2 text-center">
              <div className="text-gray-400">Total</div>
              <div className="font-bold text-navy-800">{total != null ? rupees(total) : '—'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-gray-400">Advance</div>
              <div className="font-medium">{challan.advance != null ? rupees(challan.advance) : '—'}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <div className="text-gray-400">Balance</div>
              <div className="font-bold text-green-700">{balance != null ? rupees(balance) : '—'}</div>
            </div>
          </div>

          {challan.notes && <p className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">{challan.notes}</p>}

          <div className="flex gap-2 pt-1 border-t">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onEdit(challan) }}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onDelete(challan.id) }}
              className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); sendChallanOnWhatsApp(challan, customer) }}
              className="text-xs px-3 py-1.5 text-white rounded-lg transition-colors flex items-center gap-1.5"
              style={{ backgroundColor: '#25D366' }}
            >
              💬 Send on WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
