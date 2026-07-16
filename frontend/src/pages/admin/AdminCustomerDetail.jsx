import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'

const EMPTY_RX = {
  prescription_type: 'lens',
  right_sph:'', right_cyl:'', right_axis:'', right_add:'',
  left_sph:'', left_cyl:'', left_axis:'', left_add:'',
  pd_distance:'', pd_near:'', add_vision_right:'', add_vision_left:'',
  vision_type:'Single Vision', doctor_name:'', power_source:'Shop', notes:'',
  contact_lens_type:'', disposable_schedule:'', pack_quantity:'', num_lenses:''
}

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Other']
const BALANCE_PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Other', 'Pending']

function emptyVisit() {
  return {
    visit_date: todayDatetimeLocal(),
    frame_name:'', frame_mrp:'', frame_discount_pct:'',
    lens_name:'', lens_mrp:'', lens_discount_pct:'',
    advance:'', advance_payment_mode:'Cash', balance_payment_mode:'Pending',
    notes:''
  }
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

function buildWhatsAppMessage(rx, customerName, customerTitle) {
  const date = new Date(rx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const patient = `${customerTitle ? customerTitle + ' ' : ''}${customerName}`

  if (rx.prescription_type === 'contact') {
    return `🔵 *NetraKiran — Contact Lens Prescription*
━━━━━━━━━━━━━━━━━━━━
Patient: ${patient}
Date: ${date}

Lens Type: ${rx.contact_lens_type || '—'}
Schedule: ${rx.disposable_schedule || '—'}
Pack: ${rx.pack_quantity || '—'}
No. of Lenses: ${rx.num_lenses || '—'}
👨‍⚕️ Doctor: ${rx.doctor_name || '—'}
━━━━━━━━━━━━━━━━━━━━
For queries, contact NetraKiran.`
  }

  return `👁️ *NetraKiran — Prescription Details*
━━━━━━━━━━━━━━━━━━━━
Patient: ${patient}
Date: ${date}

*RIGHT EYE (OD)*
• SPH: ${rx.right_sph || '—'}   CYL: ${rx.right_cyl || '—'}
• AXIS: ${rx.right_axis || '—'}   ADD: ${rx.right_add || '—'}

*LEFT EYE (OS)*
• SPH: ${rx.left_sph || '—'}   CYL: ${rx.left_cyl || '—'}
• AXIS: ${rx.left_axis || '—'}   ADD: ${rx.left_add || '—'}

📏 PD Distance: ${rx.pd_distance || '—'}
🔬 Vision Type: ${rx.vision_type || '—'}
👨‍⚕️ Doctor: ${rx.doctor_name || '—'}
━━━━━━━━━━━━━━━━━━━━
For queries, contact NetraKiran.`
}

function sendRxOnWhatsApp(rx, customer) {
  const phone = formatPhoneForWhatsApp(customer?.phone)
  const message = buildWhatsAppMessage(rx, customer?.full_name || 'Customer', customer?.title)
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

// Legacy visits (recorded before the frame/lens % discount fields existed)
// stored a flat total_amount + an overall discount_given %.
function calcOriginalAmount(totalAmount, discountGiven) {
  const total = Number(totalAmount) || 0
  const discount = Number(discountGiven) || 0
  if (!discount) return total
  return Math.round(total / (1 - discount / 100))
}

function calcDiscountedAmount(mrp, discountPct) {
  const m = Number(mrp) || 0
  const p = Number(discountPct) || 0
  return Math.round(m * (1 - p / 100) * 100) / 100
}

function calcVisitTotals(form) {
  const frameAmt = calcDiscountedAmount(form.frame_mrp, form.frame_discount_pct)
  const lensAmt = calcDiscountedAmount(form.lens_mrp, form.lens_discount_pct)
  const total = frameAmt + lensAmt
  const balance = total - (Number(form.advance) || 0)
  return { frameAmt, lensAmt, total, balance }
}

function rupees(n) {
  return `₹${(Number(n) || 0).toLocaleString('en-IN')}`
}

function paymentModeIcon(mode) {
  const icons = { Cash: '💵', Card: '💳', UPI: '📱' }
  return icons[mode] || '🔹'
}

function buildBillWhatsAppMessage(visit, customerName, customerTitle) {
  const date = new Date(visit.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const patient = `${customerTitle ? customerTitle + ' ' : ''}${customerName}`
  const isLegacy = !visit.frame_name && !visit.lens_name

  if (isLegacy) {
    const total = Number(visit.total_amount) || 0
    const discount = Number(visit.discount_given) || 0
    let pricingBlock
    if (discount > 0) {
      const original = calcOriginalAmount(total, discount)
      const saved = original - total
      pricingBlock = `💰 *Pricing*
Original Amount: ₹${original.toLocaleString('en-IN')}
Discount: ${discount}% (−₹${saved.toLocaleString('en-IN')})
*Final Amount: ₹${total.toLocaleString('en-IN')}*`
    } else {
      pricingBlock = `*Amount Paid: ₹${total.toLocaleString('en-IN')}*`
    }
    return `🧾 *NetraKiran — Purchase Receipt*
━━━━━━━━━━━━━━━━━━━━
Customer: ${patient}
Date: ${date}

🛍️ Items: ${visit.items_purchased || '—'}

${pricingBlock}

Thank you for visiting NetraKiran! 🙏
━━━━━━━━━━━━━━━━━━━━`
  }

  const frameAmt = calcDiscountedAmount(visit.frame_mrp, visit.frame_discount_pct)
  const lensAmt = calcDiscountedAmount(visit.lens_mrp, visit.lens_discount_pct)
  const total = visit.total_amount != null ? Number(visit.total_amount) : frameAmt + lensAmt
  const advance = Number(visit.advance) || 0
  const balance = total - advance

  let msg = `*NetraKiran Optics*
LGF/3, Retailx Shopping Complex, Abhay Khand-3, Indirapuram
📞 7011295507

*Customer:* ${patient}
*Date:* ${date}

*Frame:* ${visit.frame_name || '—'}  MRP: ${rupees(visit.frame_mrp)}  Disc: ${visit.frame_discount_pct || 0}% → ${rupees(frameAmt)}
*Lens:* ${visit.lens_name || '—'}  MRP: ${rupees(visit.lens_mrp)}  Disc: ${visit.lens_discount_pct || 0}% → ${rupees(lensAmt)}
*Total:* ${rupees(total)}
*Advance:* ${rupees(advance)}${visit.advance_payment_mode ? ` (${visit.advance_payment_mode})` : ''}
*Balance:* ${rupees(balance)}${visit.balance_payment_mode ? ` (${visit.balance_payment_mode})` : ''}`

  if (visit.notes) msg += `\n\n${visit.notes}`
  return msg
}

function sendBillOnWhatsApp(visit, customer) {
  const phone = formatPhoneForWhatsApp(customer?.phone)
  const message = buildBillWhatsAppMessage(visit, customer?.full_name || 'Customer', customer?.title)
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

  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [showRxForm, setShowRxForm] = useState(false)
  const [rxForm, setRxForm] = useState({ ...EMPTY_RX })
  const [editingRxId, setEditingRxId] = useState(null)

  const [showVisitForm, setShowVisitForm] = useState(false)
  const [visitForm, setVisitForm] = useState(emptyVisit())
  const [editingVisitId, setEditingVisitId] = useState(null)
  const [editVisitForm, setEditVisitForm] = useState({})

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

  // ── Prescriptions ──────────────────────────────────────────────────

  const openAddRx = () => {
    setRxForm({ ...EMPTY_RX })
    setEditingRxId(null)
    setShowRxForm(true)
  }

  const openEditRx = (rx) => {
    setRxForm({
      prescription_type: rx.prescription_type || 'lens',
      right_sph: rx.right_sph ?? '',
      right_cyl: rx.right_cyl ?? '',
      right_axis: rx.right_axis ?? '',
      right_add: rx.right_add ?? '',
      left_sph: rx.left_sph ?? '',
      left_cyl: rx.left_cyl ?? '',
      left_axis: rx.left_axis ?? '',
      left_add: rx.left_add ?? '',
      pd_distance: rx.pd_distance ?? '',
      pd_near: rx.pd_near ?? '',
      add_vision_right: rx.add_vision_right ?? '',
      add_vision_left: rx.add_vision_left ?? '',
      vision_type: rx.vision_type || 'Single Vision',
      doctor_name: rx.doctor_name || '',
      power_source: rx.power_source || 'Shop',
      notes: rx.notes || '',
      contact_lens_type: rx.contact_lens_type || '',
      disposable_schedule: rx.disposable_schedule || '',
      pack_quantity: rx.pack_quantity || '',
      num_lenses: rx.num_lenses ?? ''
    })
    setEditingRxId(rx.id)
    setShowRxForm(true)
  }

  const closeRxForm = () => {
    setShowRxForm(false)
    setEditingRxId(null)
    setRxForm({ ...EMPTY_RX })
  }

  const saveRx = async (e) => {
    e.preventDefault()
    try {
      if (editingRxId) {
        const { data } = await api.put(`/customer-profiles/prescriptions/${editingRxId}`, rxForm)
        setPrescriptions(prev => prev.map(p => p.id === editingRxId ? data : p))
      } else if (rxForm.prescription_type === 'both') {
        const { data: lensData } = await api.post(`/customer-profiles/${id}/prescriptions`, { ...rxForm, prescription_type: 'lens' })
        const { data: contactData } = await api.post(`/customer-profiles/${id}/prescriptions`, { ...rxForm, prescription_type: 'contact' })
        setPrescriptions(prev => [lensData, contactData, ...prev])
      } else {
        const { data } = await api.post(`/customer-profiles/${id}/prescriptions`, rxForm)
        setPrescriptions(prev => [data, ...prev])
      }
      closeRxForm()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save prescription')
    }
  }

  const deleteRx = async (rxId) => {
    if (!confirm('Delete this prescription?')) return
    try {
      await api.delete(`/customer-profiles/prescriptions/${rxId}`)
      setPrescriptions(prev => prev.filter(p => p.id !== rxId))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete prescription')
    }
  }

  // ── Visits ──────────────────────────────────────────────────────────

  const addVisit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post(`/customer-profiles/${id}/visits`, visitForm)
      setVisits(prev => [data, ...prev])
      setShowVisitForm(false)
      setVisitForm(emptyVisit())
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save visit')
    }
  }

  const openEditVisit = (v) => {
    setEditVisitForm({
      visit_date: toDatetimeLocal(v.visit_date),
      frame_name: v.frame_name || '',
      frame_mrp: v.frame_mrp ?? '',
      frame_discount_pct: v.frame_discount_pct ?? '',
      lens_name: v.lens_name || '',
      lens_mrp: v.lens_mrp ?? '',
      lens_discount_pct: v.lens_discount_pct ?? '',
      advance: v.advance ?? '',
      advance_payment_mode: v.advance_payment_mode || 'Cash',
      balance_payment_mode: v.balance_payment_mode || 'Pending',
      notes: v.notes || ''
    })
    setEditingVisitId(v.id)
  }

  const saveEditVisit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.put(`/customer-profiles/visits/${editingVisitId}`, editVisitForm)
      setVisits(prev => prev.map(v => v.id === editingVisitId ? data : v))
      setEditingVisitId(null)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update visit')
    }
  }

  const deleteVisit = async (visitId) => {
    if (!confirm('Delete this visit record?')) return
    try {
      await api.delete(`/customer-profiles/visits/${visitId}`)
      setVisits(prev => prev.filter(v => v.id !== visitId))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete visit')
    }
  }

  const setInfo = k => e => setInfoForm(p => ({ ...p, [k]: e.target.value }))
  const setRx = k => e => setRxForm(p => ({ ...p, [k]: e.target.value }))
  const setVisit = k => e => setVisitForm(p => ({ ...p, [k]: e.target.value }))
  const setEV = k => e => setEditVisitForm(p => ({ ...p, [k]: e.target.value }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-navy-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!customer) return null

  const latestVisit = visits[0]
  const currentRx = prescriptions[0]
  const previousRx = prescriptions.slice(1)
  const newVisitTotals = calcVisitTotals(visitForm)
  const editVisitTotals = editingVisitId ? calcVisitTotals(editVisitForm) : null

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
          ['Total Visits', visits.length],
          ['Last Visit', latestVisit ? new Date(latestVisit.visit_date).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '—'],
          ['Last Total', latestVisit?.total_amount ? rupees(latestVisit.total_amount) : '—'],
          ['Last Advance', latestVisit?.advance != null && latestVisit.advance !== '' ? rupees(latestVisit.advance) : '—'],
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

      {/* Prescriptions & Visit History — combined section */}
      <div className="card p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-base text-gray-800">Prescriptions & Visit History</h2>
          <div className="relative">
            <button
              onClick={() => {
                if (showRxForm) { closeRxForm(); return }
                if (showVisitForm) { setShowVisitForm(false); return }
                setAddMenuOpen(o => !o)
              }}
              className="btn-primary py-1.5 px-3 text-sm"
            >
              {showRxForm || showVisitForm ? '✕ Cancel' : addMenuOpen ? '✕ Close' : '+ Add'}
            </button>
            {addMenuOpen && !showRxForm && !showVisitForm && (
              <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setAddMenuOpen(false); openAddRx() }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  + Add Prescription
                </button>
                <button
                  type="button"
                  onClick={() => { setAddMenuOpen(false); setShowVisitForm(true) }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  + Add Visit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Prescriptions */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Prescriptions</p>

          {showRxForm && (
            <form onSubmit={saveRx} className="card p-4 space-y-3 bg-gray-50 border mb-4">
              <h4 className="font-medium text-sm text-gray-700">
                {editingRxId ? 'Edit Prescription' : 'New Prescription'}
              </h4>

              {/* Prescription type selector */}
              <div className={`grid gap-2 ${editingRxId ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {(editingRxId
                  ? [['lens','Spectacle Lens'],['contact','Contact Lens']]
                  : [['lens','Spectacle Lens'],['contact','Contact Lens'],['both','Both']]
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRxForm(p => ({ ...p, prescription_type: val }))}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors text-center ${
                      rxForm.prescription_type === val
                        ? 'border-navy-800 bg-navy-50 text-navy-800'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {rxForm.prescription_type === 'both' ? (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Section A · Spectacle Lens Details</p>
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="bg-navy-800 text-white">
                          <th className="p-2">Eye</th><th className="p-2">SPH</th><th className="p-2">CYL</th><th className="p-2">AXIS</th><th className="p-2">ADD</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white">
                          <td className="p-1 font-medium text-center">OD (Right)</td>
                          {['right_sph','right_cyl','right_axis','right_add'].map(f => (
                            <td key={f} className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={rxForm[f]} onChange={setRx(f)}/></td>
                          ))}
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="p-1 font-medium text-center">OS (Left)</td>
                          {['left_sph','left_cyl','left_axis','left_add'].map(f => (
                            <td key={f} className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={rxForm[f]} onChange={setRx(f)}/></td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="label text-xs">PD Distance</label><input className="input py-1 text-sm" value={rxForm.pd_distance} onChange={setRx('pd_distance')}/></div>
                    <div><label className="label text-xs">PD Right</label><input className="input py-1 text-sm" value={rxForm.add_vision_right} onChange={setRx('add_vision_right')}/></div>
                    <div><label className="label text-xs">PD Left</label><input className="input py-1 text-sm" value={rxForm.add_vision_left} onChange={setRx('add_vision_left')}/></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label text-xs">Vision Type</label>
                      <select className="input py-1 text-sm" value={rxForm.vision_type} onChange={setRx('vision_type')}>
                        {['Single Vision','Progressive','Bifocal','Trifocal','Tinted','Photochromic','Blue Cut','Hardcoat'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">Power Source</label>
                      <select className="input py-1 text-sm" value={rxForm.power_source} onChange={setRx('power_source')}>
                        {['Shop','External Doctor','Self-Provided','Other'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">Section B · Contact Lens Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label text-xs">Type of Contact Lens</label>
                      <select className="input py-1 text-sm" value={rxForm.contact_lens_type} onChange={setRx('contact_lens_type')}>
                        <option value="">Select type…</option>
                        {['Soft Contact Lenses','Orthokeratology (Ortho-K) Lenses','Colored Contact Lenses','Daily Disposable Lenses'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">Disposable Schedule</label>
                      <select className="input py-1 text-sm" value={rxForm.disposable_schedule} onChange={setRx('disposable_schedule')}>
                        <option value="">Select schedule…</option>
                        {['Daily Disposable','Bi-Weekly Disposable','Monthly Disposable','Yearly Disposable'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">Pack Quantity</label>
                      <select className="input py-1 text-sm" value={rxForm.pack_quantity} onChange={setRx('pack_quantity')}>
                        <option value="">Select pack…</option>
                        {['Trial Pack','Pack of 1','Pack of 2','Pack of 3','Pack of 4','Pack of 5'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">Number of Lenses</label>
                      <input className="input py-1 text-sm" type="number" min="1" placeholder="e.g. 6, 12, 30" value={rxForm.num_lenses} onChange={setRx('num_lenses')}/>
                    </div>
                  </div>
                  <div><label className="label text-xs">Doctor</label><input className="input py-1 text-sm" placeholder="Dr. ..." value={rxForm.doctor_name} onChange={setRx('doctor_name')}/></div>
                  <div><label className="label text-xs">Notes</label><textarea className="input text-sm resize-none" rows="2" value={rxForm.notes} onChange={setRx('notes')}/></div>
                </>
              ) : rxForm.prescription_type === 'lens' ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="bg-navy-800 text-white">
                          <th className="p-2">Eye</th><th className="p-2">SPH</th><th className="p-2">CYL</th><th className="p-2">AXIS</th><th className="p-2">ADD</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white">
                          <td className="p-1 font-medium text-center">OD (Right)</td>
                          {['right_sph','right_cyl','right_axis','right_add'].map(f => (
                            <td key={f} className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={rxForm[f]} onChange={setRx(f)}/></td>
                          ))}
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="p-1 font-medium text-center">OS (Left)</td>
                          {['left_sph','left_cyl','left_axis','left_add'].map(f => (
                            <td key={f} className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={rxForm[f]} onChange={setRx(f)}/></td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="label text-xs">PD Distance</label><input className="input py-1 text-sm" value={rxForm.pd_distance} onChange={setRx('pd_distance')}/></div>
                    <div><label className="label text-xs">PD Right</label><input className="input py-1 text-sm" value={rxForm.add_vision_right} onChange={setRx('add_vision_right')}/></div>
                    <div><label className="label text-xs">PD Left</label><input className="input py-1 text-sm" value={rxForm.add_vision_left} onChange={setRx('add_vision_left')}/></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label text-xs">Vision Type</label>
                      <select className="input py-1 text-sm" value={rxForm.vision_type} onChange={setRx('vision_type')}>
                        {['Single Vision','Progressive','Bifocal','Trifocal','Tinted','Photochromic','Blue Cut','Hardcoat'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div><label className="label text-xs">Doctor</label><input className="input py-1 text-sm" placeholder="Dr. ..." value={rxForm.doctor_name} onChange={setRx('doctor_name')}/></div>
                    <div>
                      <label className="label text-xs">Power Source</label>
                      <select className="input py-1 text-sm" value={rxForm.power_source} onChange={setRx('power_source')}>
                        {['Shop','External Doctor','Self-Provided','Other'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label className="label text-xs">Notes</label><textarea className="input text-sm resize-none" rows="2" value={rxForm.notes} onChange={setRx('notes')}/></div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label text-xs">Type of Contact Lens</label>
                      <select className="input py-1 text-sm" value={rxForm.contact_lens_type} onChange={setRx('contact_lens_type')}>
                        <option value="">Select type…</option>
                        {['Soft Contact Lenses','Orthokeratology (Ortho-K) Lenses','Colored Contact Lenses','Daily Disposable Lenses'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">Disposable Schedule</label>
                      <select className="input py-1 text-sm" value={rxForm.disposable_schedule} onChange={setRx('disposable_schedule')}>
                        <option value="">Select schedule…</option>
                        {['Daily Disposable','Bi-Weekly Disposable','Monthly Disposable','Yearly Disposable'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">Pack Quantity</label>
                      <select className="input py-1 text-sm" value={rxForm.pack_quantity} onChange={setRx('pack_quantity')}>
                        <option value="">Select pack…</option>
                        {['Trial Pack','Pack of 1','Pack of 2','Pack of 3','Pack of 4','Pack of 5'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">Number of Lenses</label>
                      <input className="input py-1 text-sm" type="number" min="1" placeholder="e.g. 6, 12, 30" value={rxForm.num_lenses} onChange={setRx('num_lenses')}/>
                    </div>
                  </div>
                  <div><label className="label text-xs">Doctor</label><input className="input py-1 text-sm" placeholder="Dr. ..." value={rxForm.doctor_name} onChange={setRx('doctor_name')}/></div>
                  <div><label className="label text-xs">Notes</label><textarea className="input text-sm resize-none" rows="2" value={rxForm.notes} onChange={setRx('notes')}/></div>
                </>
              )}

              <button type="submit" className="btn-primary text-sm py-2">
                {editingRxId ? 'Update Prescription' : 'Save Prescription'}
              </button>
            </form>
          )}

          {prescriptions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No prescriptions recorded yet</p>
          ) : (
            <div className="space-y-4">
              {currentRx && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Prescription</p>
                  <RxCard rx={currentRx} customer={customer} defaultOpen onEdit={openEditRx} onDelete={deleteRx} />
                </div>
              )}
              {previousRx.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Previous Prescriptions ({previousRx.length})
                  </p>
                  <div className="space-y-2">
                    {previousRx.map(rx => (
                      <RxCard key={rx.id} rx={rx} customer={customer} onEdit={openEditRx} onDelete={deleteRx} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <hr className="border-gray-200" />

        {/* Visit History */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Visit History</p>

          {showVisitForm && (
            <form onSubmit={addVisit} className="card p-4 space-y-3 bg-gray-50 border mb-4">
              <h4 className="font-medium text-sm text-gray-700">Record Visit</h4>
              <div>
                <label className="label text-xs">Date & Time</label>
                <input className="input py-1 text-sm" type="datetime-local" value={visitForm.visit_date} onChange={setVisit('visit_date')}/>
              </div>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Frame</p>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="label text-xs">Name / Description</label><input className="input py-1 text-sm" value={visitForm.frame_name} onChange={setVisit('frame_name')}/></div>
                <div><label className="label text-xs">MRP (₹)</label><input className="input py-1 text-sm" type="number" value={visitForm.frame_mrp} onChange={setVisit('frame_mrp')}/></div>
                <div><label className="label text-xs">Discount (%)</label><input className="input py-1 text-sm" type="number" min="0" max="100" value={visitForm.frame_discount_pct} onChange={setVisit('frame_discount_pct')}/></div>
              </div>
              <p className="text-xs text-gray-500">Frame price after discount: <span className="font-semibold text-gray-800">{rupees(newVisitTotals.frameAmt)}</span></p>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lens</p>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="label text-xs">Name / Description</label><input className="input py-1 text-sm" value={visitForm.lens_name} onChange={setVisit('lens_name')}/></div>
                <div><label className="label text-xs">MRP (₹)</label><input className="input py-1 text-sm" type="number" value={visitForm.lens_mrp} onChange={setVisit('lens_mrp')}/></div>
                <div><label className="label text-xs">Discount (%)</label><input className="input py-1 text-sm" type="number" min="0" max="100" value={visitForm.lens_discount_pct} onChange={setVisit('lens_discount_pct')}/></div>
              </div>
              <p className="text-xs text-gray-500">Lens price after discount: <span className="font-semibold text-gray-800">{rupees(newVisitTotals.lensAmt)}</span></p>

              <div className="bg-navy-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400">Total</p>
                <p className="font-bold text-navy-800 text-lg">{rupees(newVisitTotals.total)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Advance (₹)</label>
                  <input className="input py-1 text-sm" type="number" value={visitForm.advance} onChange={setVisit('advance')}/>
                </div>
                <div>
                  <label className="label text-xs">Advance Payment Mode</label>
                  <select className="input py-1 text-sm" value={visitForm.advance_payment_mode} onChange={setVisit('advance_payment_mode')}>
                    {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Balance</p>
                  <p className="font-bold text-green-700 text-lg">{rupees(newVisitTotals.balance)}</p>
                </div>
                <div>
                  <label className="label text-xs">Balance Payment Mode</label>
                  <select className="input py-1 text-sm" value={visitForm.balance_payment_mode} onChange={setVisit('balance_payment_mode')}>
                    {BALANCE_PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label text-xs">Notes</label>
                <textarea className="input text-sm resize-none" rows="2" value={visitForm.notes} onChange={setVisit('notes')}/>
              </div>
              <button type="submit" className="btn-primary text-sm py-2">Save Visit</button>
            </form>
          )}

          {visits.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No visits recorded yet</p>
          ) : (
            <div className="space-y-3">
              {visits.map(v => (
                editingVisitId === v.id ? (
                  <form key={v.id} onSubmit={saveEditVisit} className="card p-4 space-y-3 bg-blue-50 border">
                    <div>
                      <label className="label text-xs">Date & Time</label>
                      <input className="input py-1 text-sm" type="datetime-local" value={editVisitForm.visit_date} onChange={setEV('visit_date')}/>
                    </div>

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Frame</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div><label className="label text-xs">Name / Description</label><input className="input py-1 text-sm" value={editVisitForm.frame_name} onChange={setEV('frame_name')}/></div>
                      <div><label className="label text-xs">MRP (₹)</label><input className="input py-1 text-sm" type="number" value={editVisitForm.frame_mrp} onChange={setEV('frame_mrp')}/></div>
                      <div><label className="label text-xs">Discount (%)</label><input className="input py-1 text-sm" type="number" min="0" max="100" value={editVisitForm.frame_discount_pct} onChange={setEV('frame_discount_pct')}/></div>
                    </div>
                    <p className="text-xs text-gray-500">Frame price after discount: <span className="font-semibold text-gray-800">{rupees(editVisitTotals.frameAmt)}</span></p>

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lens</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div><label className="label text-xs">Name / Description</label><input className="input py-1 text-sm" value={editVisitForm.lens_name} onChange={setEV('lens_name')}/></div>
                      <div><label className="label text-xs">MRP (₹)</label><input className="input py-1 text-sm" type="number" value={editVisitForm.lens_mrp} onChange={setEV('lens_mrp')}/></div>
                      <div><label className="label text-xs">Discount (%)</label><input className="input py-1 text-sm" type="number" min="0" max="100" value={editVisitForm.lens_discount_pct} onChange={setEV('lens_discount_pct')}/></div>
                    </div>
                    <p className="text-xs text-gray-500">Lens price after discount: <span className="font-semibold text-gray-800">{rupees(editVisitTotals.lensAmt)}</span></p>

                    <div className="bg-navy-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="font-bold text-navy-800 text-lg">{rupees(editVisitTotals.total)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Advance (₹)</label>
                        <input className="input py-1 text-sm" type="number" value={editVisitForm.advance} onChange={setEV('advance')}/>
                      </div>
                      <div>
                        <label className="label text-xs">Advance Payment Mode</label>
                        <select className="input py-1 text-sm" value={editVisitForm.advance_payment_mode} onChange={setEV('advance_payment_mode')}>
                          {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-end">
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400">Balance</p>
                        <p className="font-bold text-green-700 text-lg">{rupees(editVisitTotals.balance)}</p>
                      </div>
                      <div>
                        <label className="label text-xs">Balance Payment Mode</label>
                        <select className="input py-1 text-sm" value={editVisitForm.balance_payment_mode} onChange={setEV('balance_payment_mode')}>
                          {BALANCE_PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="label text-xs">Notes</label>
                      <textarea className="input text-sm resize-none" rows="2" value={editVisitForm.notes} onChange={setEV('notes')}/>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary text-xs py-1.5 px-3">Save</button>
                      <button type="button" onClick={() => setEditingVisitId(null)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <VisitCard key={v.id} visit={v} customer={customer} onEdit={openEditVisit} onDelete={deleteVisit} />
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VisitCard({ visit, customer, onEdit, onDelete }) {
  const isLegacy = !visit.frame_name && !visit.lens_name
  const frameAmt = calcDiscountedAmount(visit.frame_mrp, visit.frame_discount_pct)
  const lensAmt = calcDiscountedAmount(visit.lens_mrp, visit.lens_discount_pct)
  const total = visit.total_amount != null ? Number(visit.total_amount) : frameAmt + lensAmt
  const advance = Number(visit.advance) || 0
  const balance = total - advance

  return (
    <div className="border rounded-xl p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-gray-700 font-medium">{new Date(visit.visit_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>
          <p className="text-xs text-gray-400">{new Date(visit.visit_date).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</p>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => onEdit(visit)} className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">Edit</button>
          <button type="button" onClick={() => onDelete(visit.id)} className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">Delete</button>
          <button
            type="button"
            onClick={() => sendBillOnWhatsApp(visit, customer)}
            className="text-xs px-2 py-1 text-white rounded-lg transition-colors flex items-center gap-1"
            style={{ backgroundColor: '#25D366' }}
          >
            💬 Bill
          </button>
        </div>
      </div>

      {isLegacy ? (
        <div className="mt-3 text-sm">
          <p className="text-gray-800">{visit.items_purchased || '—'}</p>
          {visit.total_amount ? (
            visit.discount_given ? (
              <div className="mt-1">
                <p className="text-xs text-gray-400 line-through">₹{calcOriginalAmount(visit.total_amount, visit.discount_given).toLocaleString('en-IN')}</p>
                <p className="text-xs text-amber-600">−{visit.discount_given}%</p>
                <p className="font-semibold text-green-600">₹{Number(visit.total_amount).toLocaleString('en-IN')}</p>
              </div>
            ) : (
              <p className="font-semibold text-green-600 mt-1">₹{Number(visit.total_amount).toLocaleString('en-IN')}</p>
            )
          ) : null}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-gray-400">Frame</div>
            <div className="font-medium">{visit.frame_name || '—'}</div>
            <div className="text-gray-500 mt-0.5">MRP: {rupees(visit.frame_mrp)} · Disc: {visit.frame_discount_pct || 0}% → {rupees(frameAmt)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-gray-400">Lens</div>
            <div className="font-medium">{visit.lens_name || '—'}</div>
            <div className="text-gray-500 mt-0.5">MRP: {rupees(visit.lens_mrp)} · Disc: {visit.lens_discount_pct || 0}% → {rupees(lensAmt)}</div>
          </div>
        </div>
      )}

      {!isLegacy && (
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <div className="bg-navy-50 rounded-lg p-2 text-center">
            <div className="text-gray-400">Total</div>
            <div className="font-bold text-navy-800">{rupees(total)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-gray-400">Advance</div>
            {visit.advance_payment_mode ? (
              <div className="relative inline-block group/adv">
                <div className="font-medium cursor-default">{rupees(advance)}</div>
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 opacity-0 group-hover/adv:opacity-100 transition-opacity whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg z-10">
                  {paymentModeIcon(visit.advance_payment_mode)} {visit.advance_payment_mode}
                </div>
              </div>
            ) : (
              <div className="font-medium">{rupees(advance)}</div>
            )}
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <div className="text-gray-400">Balance</div>
            <div className="font-bold text-green-700">{rupees(balance)}</div>
            {visit.balance_payment_mode && <div className="text-gray-400">{visit.balance_payment_mode}</div>}
          </div>
        </div>
      )}

      {visit.notes && <p className="text-xs text-gray-500 mt-2">{visit.notes}</p>}
    </div>
  )
}

function RxCard({ rx, customer, defaultOpen = false, onEdit, onDelete }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {rx.prescription_type === 'contact' ? (
            <>
              <span className="font-medium text-sm text-gray-800">{rx.contact_lens_type || 'Contact Lens'}</span>
              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">Contact Lens</span>
            </>
          ) : (
            <span className="font-medium text-sm text-gray-800">{rx.vision_type}</span>
          )}
          <span className="text-xs text-gray-400">
            {new Date(rx.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
          </span>
          {rx.doctor_name && <span className="text-xs text-gray-500">· Dr. {rx.doctor_name}</span>}
          {rx.prescription_type !== 'contact' && rx.power_source && rx.power_source !== 'Shop' && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">External RX</span>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="p-4 space-y-3 bg-white">
          {rx.prescription_type === 'contact' ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Lens Type', rx.contact_lens_type],
                ['Disposable Schedule', rx.disposable_schedule],
                ['Pack Quantity', rx.pack_quantity],
                ['Number of Lenses', rx.num_lenses],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-400">{k}</div>
                  <div className="font-medium">{v || '—'}</div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="text-xs w-full border-collapse">
                  <thead>
                    <tr className="bg-navy-800 text-white text-center">
                      <th className="p-2"></th><th className="p-2">SPH.</th><th className="p-2">CYL.</th><th className="p-2">AXIS</th><th className="p-2">VISION</th><th className="p-2">ADD.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-center border-b">
                      <td className="p-2 font-medium bg-gray-50">R</td>
                      <td className="p-2">{rx.right_sph || '—'}</td>
                      <td className="p-2">{rx.right_cyl || '—'}</td>
                      <td className="p-2">{rx.right_axis || '—'}</td>
                      <td className="p-2" rowSpan={2}>{rx.vision_type || '—'}</td>
                      <td className="p-2">{rx.right_add || '—'}</td>
                    </tr>
                    <tr className="text-center">
                      <td className="p-2 font-medium bg-gray-50">L</td>
                      <td className="p-2">{rx.left_sph || '—'}</td>
                      <td className="p-2">{rx.left_cyl || '—'}</td>
                      <td className="p-2">{rx.left_axis || '—'}</td>
                      <td className="p-2">{rx.left_add || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[['PD Dist', rx.pd_distance], ['PD Right', rx.add_vision_right], ['PD Left', rx.add_vision_left]].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-gray-400">{k}</div>
                    <div className="font-medium">{v || '—'}</div>
                  </div>
                ))}
              </div>
              {rx.power_source && rx.power_source !== 'Shop' && (
                <p className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">Power from: {rx.power_source}</p>
              )}
            </>
          )}
          {rx.notes && <p className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">{rx.notes}</p>}
          <div className="flex gap-2 pt-1 border-t">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onEdit(rx) }}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onDelete(rx.id) }}
              className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); sendRxOnWhatsApp(rx, customer) }}
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
