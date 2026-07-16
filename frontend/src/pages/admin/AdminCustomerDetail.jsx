import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Other']

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function toDateInput(val) {
  if (!val) return ''
  return new Date(val).toISOString().slice(0, 10)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function emptyChallan() {
  return {
    date_of_booking: todayDate(),
    date_of_delivery: '',
    right_sph: '', right_cyl: '', right_axis: '', right_vision: '', right_add: '',
    left_sph: '', left_cyl: '', left_axis: '', left_add: '',
    frame_name: '', frame_mrp: '', frame_discount_pct: '',
    lens_name: '', lens_mrp: '', lens_discount_pct: '',
    advance: '', advance_payment_mode: 'Cash',
    notes: ''
  }
}

function calcAmount(mrp, pct) {
  const m = Number(mrp) || 0
  const p = Number(pct) || 0
  return Math.round(m * (1 - p / 100) * 100) / 100
}

function calcTotals(form) {
  const frameAmt = calcAmount(form.frame_mrp, form.frame_discount_pct)
  const lensAmt = calcAmount(form.lens_mrp, form.lens_discount_pct)
  const total = frameAmt + lensAmt
  const totalMrp = (Number(form.frame_mrp) || 0) + (Number(form.lens_mrp) || 0)
  const totalDiscount = totalMrp - total
  const balance = total - (Number(form.advance) || 0)
  return { frameAmt, lensAmt, total, totalDiscount, balance }
}

function rupees(n) {
  return `₹${(Number(n) || 0).toLocaleString('en-IN')}`
}

function paymentModeIcon(mode) {
  const icons = { Cash: '💵', Card: '💳', UPI: '📱' }
  return icons[mode] || '🔹'
}

function formatPhoneForWhatsApp(phone) {
  let digits = (phone || '').replace(/[\s\-+]/g, '')
  if (!digits.startsWith('91')) digits = `91${digits}`
  return digits
}

function buildChallanWhatsAppMessage(challan, customer) {
  const frameAmt = calcAmount(challan.frame_mrp, challan.frame_discount_pct)
  const lensAmt = calcAmount(challan.lens_mrp, challan.lens_discount_pct)
  const total = frameAmt + lensAmt
  const advance = Number(challan.advance) || 0
  const balance = total - advance
  const patient = `${customer?.title ? customer.title + ' ' : ''}${customer?.full_name || 'Customer'}`

  let msg = `*NetraKiran Optics & Chikitsalaya*
LGF-3 Retailx Shopping Complex, Abhay Khand Part-3, Indirapuram GZB
📞 7011295507

*Job No.:* ${challan.job_no}
*Dt. of Booking:* ${formatDate(challan.date_of_booking)}
*Dt. of Delivery:* ${formatDate(challan.date_of_delivery)}

*Name:* ${patient}
*Address:* ${customer?.address || '—'}
*Ph.:* ${customer?.phone || '—'}

*SPECTACLE POWER*
       SPH    CYL    AXIS   VISION   ADD
R:    ${challan.right_sph ?? '—'}  ${challan.right_cyl ?? '—'}  ${challan.right_axis ?? '—'}  ${challan.right_vision || '—'}   ${challan.right_add ?? '—'}
L:    ${challan.left_sph ?? '—'}  ${challan.left_cyl ?? '—'}  ${challan.left_axis ?? '—'}           ${challan.left_add ?? '—'}

*Frame:* ${challan.frame_name || '—'}
MRP: ₹${(Number(challan.frame_mrp) || 0).toLocaleString('en-IN')} | Discount: ${challan.frame_discount_pct || 0}% | Amount: ₹${frameAmt.toLocaleString('en-IN')}

*Lens:* ${challan.lens_name || '—'}
MRP: ₹${(Number(challan.lens_mrp) || 0).toLocaleString('en-IN')} | Discount: ${challan.lens_discount_pct || 0}% | Amount: ₹${lensAmt.toLocaleString('en-IN')}

*Total:* ₹${total.toLocaleString('en-IN')}
*Advance:* ₹${advance.toLocaleString('en-IN')} (${challan.advance_payment_mode || 'Cash'})
*Balance:* ₹${balance.toLocaleString('en-IN')}`

  if (challan.notes) msg += `\n\n${challan.notes}`
  return msg
}

function sendChallanOnWhatsApp(challan, customer) {
  const phone = formatPhoneForWhatsApp(customer?.phone)
  const message = buildChallanWhatsAppMessage(challan, customer)
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

export default function AdminCustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState(null)
  const [challans, setChallans] = useState([])
  const [loading, setLoading] = useState(true)

  const [editInfo, setEditInfo] = useState(false)
  const [infoForm, setInfoForm] = useState({})
  const [savingInfo, setSavingInfo] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyChallan())
  const [editingId, setEditingId] = useState(null)

  const load = async () => {
    try {
      const [{ data: customerData }, { data: challanData }] = await Promise.all([
        api.get(`/customer-profiles/${id}`),
        api.get(`/challans/customer/${id}`)
      ])
      setCustomer(customerData)
      setInfoForm({
        title: customerData.title || '',
        full_name: customerData.full_name || '',
        phone: customerData.phone || '',
        email: customerData.email || '',
        age: customerData.age || '',
        gender: customerData.gender || '',
        address: customerData.address || '',
        discount: customerData.discount || 0,
        notes: customerData.notes || ''
      })
      setChallans(challanData || [])
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

  // ── Challans ──────────────────────────────────────────────────────────

  const openAdd = () => {
    setForm(emptyChallan())
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (c) => {
    setForm({
      date_of_booking: toDateInput(c.date_of_booking) || todayDate(),
      date_of_delivery: toDateInput(c.date_of_delivery),
      right_sph: c.right_sph ?? '', right_cyl: c.right_cyl ?? '', right_axis: c.right_axis ?? '',
      right_vision: c.right_vision || '', right_add: c.right_add ?? '',
      left_sph: c.left_sph ?? '', left_cyl: c.left_cyl ?? '', left_axis: c.left_axis ?? '', left_add: c.left_add ?? '',
      frame_name: c.frame_name || '', frame_mrp: c.frame_mrp ?? '', frame_discount_pct: c.frame_discount_pct ?? '',
      lens_name: c.lens_name || '', lens_mrp: c.lens_mrp ?? '', lens_discount_pct: c.lens_discount_pct ?? '',
      advance: c.advance ?? '', advance_payment_mode: c.advance_payment_mode || 'Cash',
      notes: c.notes || ''
    })
    setEditingId(c.id)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyChallan())
  }

  const saveChallan = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { data } = await api.put(`/challans/${editingId}`, form)
        setChallans(prev => prev.map(c => c.id === editingId ? data : c))
      } else {
        const { data } = await api.post('/challans', { ...form, customer_id: id })
        setChallans(prev => [data, ...prev])
      }
      closeForm()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save challan')
    }
  }

  const deleteChallan = async (challanId) => {
    if (!confirm('Delete this challan?')) return
    try {
      await api.delete(`/challans/${challanId}`)
      setChallans(prev => prev.filter(c => c.id !== challanId))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete challan')
    }
  }

  const setInfo = k => e => setInfoForm(p => ({ ...p, [k]: e.target.value }))
  const setField = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-navy-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!customer) return null

  const latest = challans[0]
  const latestTotals = latest ? calcTotals(latest) : null
  const totals = calcTotals(form)

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
          ['Total Challans', challans.length],
          ['Last Challan', latest ? formatDate(latest.date_of_booking) : '—'],
          ['Last Total', latestTotals ? rupees(latestTotals.total) : '—'],
          ['Last Advance', latest?.advance != null ? rupees(latest.advance) : '—'],
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
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-base text-gray-800">Challan History</h2>
          <button
            onClick={() => (showForm || editingId) ? closeForm() : openAdd()}
            className="btn-primary py-1.5 px-3 text-sm"
          >
            {(showForm || editingId) ? '✕ Cancel' : '+ Add Challan'}
          </button>
        </div>

        {showForm && !editingId && (
          <form onSubmit={saveChallan} className="card p-4 space-y-3 bg-gray-50 border">
            <h4 className="font-medium text-sm text-gray-700">New Challan</h4>
            <ChallanFormFields form={form} setField={setField} totals={totals} />
            <button type="submit" className="btn-primary text-sm py-2">Save Challan</button>
          </form>
        )}

        {challans.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No challans recorded yet</p>
        ) : (
          <div className="space-y-3">
            {challans.map(c => (
              editingId === c.id ? (
                <form key={c.id} onSubmit={saveChallan} className="card p-4 space-y-3 bg-blue-50 border">
                  <h4 className="font-medium text-sm text-gray-700">Edit Challan — Job #{c.job_no}</h4>
                  <ChallanFormFields form={form} setField={setField} totals={totals} />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-xs py-1.5 px-3">Save</button>
                    <button type="button" onClick={closeForm} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                  </div>
                </form>
              ) : (
                <ChallanCard key={c.id} challan={c} customer={customer} onEdit={openEdit} onDelete={deleteChallan} />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChallanFormFields({ form, setField, totals }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label text-xs">Date of Booking</label><input className="input py-1 text-sm" type="date" value={form.date_of_booking} onChange={setField('date_of_booking')}/></div>
        <div><label className="label text-xs">Date of Delivery</label><input className="input py-1 text-sm" type="date" value={form.date_of_delivery} onChange={setField('date_of_delivery')}/></div>
      </div>

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Spectacle Power</p>
      <div className="overflow-x-auto">
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-navy-800 text-white">
              <th className="p-2"></th><th className="p-2">SPH.</th><th className="p-2">CYL.</th><th className="p-2">AXIS</th><th className="p-2">VISION</th><th className="p-2">ADD.</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="p-1 font-medium text-center">R</td>
              <td className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={form.right_sph} onChange={setField('right_sph')}/></td>
              <td className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={form.right_cyl} onChange={setField('right_cyl')}/></td>
              <td className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={form.right_axis} onChange={setField('right_axis')}/></td>
              <td className="p-1" rowSpan={2}><input className="input py-1 text-xs text-center w-full" placeholder="—" value={form.right_vision} onChange={setField('right_vision')}/></td>
              <td className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={form.right_add} onChange={setField('right_add')}/></td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-1 font-medium text-center">L</td>
              <td className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={form.left_sph} onChange={setField('left_sph')}/></td>
              <td className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={form.left_cyl} onChange={setField('left_cyl')}/></td>
              <td className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={form.left_axis} onChange={setField('left_axis')}/></td>
              <td className="p-1"><input className="input py-1 text-xs text-center w-full" placeholder="—" value={form.left_add} onChange={setField('left_add')}/></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Frame</p>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="label text-xs">Name</label><input className="input py-1 text-sm" value={form.frame_name} onChange={setField('frame_name')}/></div>
        <div><label className="label text-xs">MRP (₹)</label><input className="input py-1 text-sm" type="number" value={form.frame_mrp} onChange={setField('frame_mrp')}/></div>
        <div><label className="label text-xs">Discount (%)</label><input className="input py-1 text-sm" type="number" min="0" max="100" value={form.frame_discount_pct} onChange={setField('frame_discount_pct')}/></div>
      </div>
      <p className="text-xs text-gray-500">Frame price after discount: <span className="font-semibold text-gray-800">{rupees(totals.frameAmt)}</span></p>

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lens</p>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="label text-xs">Name</label><input className="input py-1 text-sm" value={form.lens_name} onChange={setField('lens_name')}/></div>
        <div><label className="label text-xs">MRP (₹)</label><input className="input py-1 text-sm" type="number" value={form.lens_mrp} onChange={setField('lens_mrp')}/></div>
        <div><label className="label text-xs">Discount (%)</label><input className="input py-1 text-sm" type="number" min="0" max="100" value={form.lens_discount_pct} onChange={setField('lens_discount_pct')}/></div>
      </div>
      <p className="text-xs text-gray-500">Lens price after discount: <span className="font-semibold text-gray-800">{rupees(totals.lensAmt)}</span></p>

      <div className="bg-navy-50 rounded-lg p-3 text-center">
        <p className="text-xs text-gray-400">Total</p>
        <p className="font-bold text-navy-800 text-lg">{rupees(totals.total)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">Advance (₹)</label>
          <input className="input py-1 text-sm" type="number" value={form.advance} onChange={setField('advance')}/>
        </div>
        <div>
          <label className="label text-xs">Payment Mode</label>
          <select className="input py-1 text-sm" value={form.advance_payment_mode} onChange={setField('advance_payment_mode')}>
            {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-3 text-center">
        <p className="text-xs text-gray-400">Balance</p>
        <p className="font-bold text-green-700 text-lg">{rupees(totals.balance)}</p>
      </div>

      <div>
        <label className="label text-xs">Notes</label>
        <textarea className="input text-sm resize-none" rows="2" value={form.notes} onChange={setField('notes')}/>
      </div>
    </>
  )
}

function ChallanCard({ challan, customer, onEdit, onDelete }) {
  const frameAmt = calcAmount(challan.frame_mrp, challan.frame_discount_pct)
  const lensAmt = calcAmount(challan.lens_mrp, challan.lens_discount_pct)
  const total = frameAmt + lensAmt
  const totalMrp = (Number(challan.frame_mrp) || 0) + (Number(challan.lens_mrp) || 0)
  const totalDiscount = totalMrp - total
  const advance = Number(challan.advance) || 0
  const balance = total - advance

  return (
    <div className="border rounded-xl p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <p className="text-gray-800 font-semibold">Job #{challan.job_no}</p>
          <p className="text-xs text-gray-400">
            Booking: {formatDate(challan.date_of_booking)} · Delivery: {formatDate(challan.date_of_delivery)}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => onEdit(challan)} className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">Edit</button>
          <button type="button" onClick={() => onDelete(challan.id)} className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">Delete</button>
          <button
            type="button"
            onClick={() => sendChallanOnWhatsApp(challan, customer)}
            className="text-xs px-2 py-1 text-white rounded-lg transition-colors flex items-center gap-1"
            style={{ backgroundColor: '#25D366' }}
          >
            💬 Send on WhatsApp
          </button>
        </div>
      </div>

      <div className="overflow-x-auto mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Spectacle Power</p>
        <table className="text-xs w-full border-collapse">
          <thead>
            <tr className="bg-navy-800 text-white text-center">
              <th className="p-2"></th><th className="p-2">SPH.</th><th className="p-2">CYL.</th><th className="p-2">AXIS</th><th className="p-2">VISION</th><th className="p-2">ADD.</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center border-b">
              <td className="p-2 font-medium bg-gray-50">R</td>
              <td className="p-2">{challan.right_sph ?? '—'}</td>
              <td className="p-2">{challan.right_cyl ?? '—'}</td>
              <td className="p-2">{challan.right_axis ?? '—'}</td>
              <td className="p-2" rowSpan={2}>{challan.right_vision || '—'}</td>
              <td className="p-2">{challan.right_add ?? '—'}</td>
            </tr>
            <tr className="text-center">
              <td className="p-2 font-medium bg-gray-50">L</td>
              <td className="p-2">{challan.left_sph ?? '—'}</td>
              <td className="p-2">{challan.left_cyl ?? '—'}</td>
              <td className="p-2">{challan.left_axis ?? '—'}</td>
              <td className="p-2">{challan.left_add ?? '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-gray-400">Frame</div>
          <div className="font-medium">{challan.frame_name || '—'}</div>
          <div className="text-gray-500 mt-0.5">MRP: {rupees(challan.frame_mrp)} · Disc: {challan.frame_discount_pct || 0}% → {rupees(frameAmt)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-gray-400">Lens</div>
          <div className="font-medium">{challan.lens_name || '—'}</div>
          <div className="text-gray-500 mt-0.5">MRP: {rupees(challan.lens_mrp)} · Disc: {challan.lens_discount_pct || 0}% → {rupees(lensAmt)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-navy-50 rounded-lg p-2 text-center">
          <div className="text-gray-400">Total</div>
          <div className="font-bold text-navy-800">{rupees(total)}</div>
          <div className="text-gray-400 text-[10px]">Disc: {rupees(totalDiscount)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-gray-400">Advance</div>
          <div className="relative inline-block group/adv">
            <div className="font-medium cursor-default">{rupees(advance)}</div>
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 opacity-0 group-hover/adv:opacity-100 transition-opacity whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg z-10">
              {paymentModeIcon(challan.advance_payment_mode)} {challan.advance_payment_mode}
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <div className="text-gray-400">Balance</div>
          <div className="font-bold text-green-700">{rupees(balance)}</div>
        </div>
      </div>

      {challan.notes && <p className="text-xs text-gray-500 mt-2">{challan.notes}</p>}
    </div>
  )
}
