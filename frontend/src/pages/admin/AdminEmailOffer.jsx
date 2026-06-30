import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'

export default function AdminEmailOffer() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const [sendToAll, setSendToAll] = useState(true)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState([]) // [{id, full_name, email}]
  const [allCount, setAllCount] = useState(null)
  const [loadingCount, setLoadingCount] = useState(true)

  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    setLoadingCount(true)
    api.get('/customers')
      .then(r => setAllCount(r.data.filter(c => c.email).length))
      .finally(() => setLoadingCount(false))
  }, [])

  const search_ = useCallback(() => {
    if (!search.trim()) { setResults([]); return }
    api.get(`/customer-profiles/search?q=${encodeURIComponent(search)}`)
      .then(r => setResults(r.data.filter(c => c.email)))
  }, [search])

  useEffect(() => { const t = setTimeout(search_, 300); return () => clearTimeout(t) }, [search_])

  const toggleSelected = (c) => {
    setSelected(p => p.some(s => s.id === c.id) ? p.filter(s => s.id !== c.id) : [...p, c])
  }

  const send = async () => {
    if (!subject.trim() || !message.trim()) {
      alert('Please fill in subject and message')
      return
    }
    if (!sendToAll && selected.length === 0) {
      alert('Please select at least one customer, or toggle "Send to all"')
      return
    }
    if (!confirm(`This will send real emails to ${sendToAll ? 'ALL customers with an email on file' : `${selected.length} selected customer(s)`}. Continue?`)) return

    setSending(true)
    setResult(null)
    try {
      const customerIds = sendToAll ? 'all' : selected.map(s => s.id)
      const { data } = await api.post('/email/send-offer', { subject, message, customerIds })
      setResult(data)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send emails')
    } finally {
      setSending(false)
    }
  }

  const recipientCount = sendToAll ? allCount : selected.length

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-heading font-bold text-xl text-gray-800">Send Offer / Announcement to Customers</h1>
        <p className="text-sm text-gray-400 mt-0.5">Compose and email an offer or announcement to your customers via Resend.</p>
      </div>

      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
        <span>⚠️</span>
        <span>This will send real emails. Double-check your message before sending.</span>
      </div>

      {/* Section 1 — Compose */}
      <div className="card p-5 space-y-3">
        <h2 className="font-heading font-semibold text-gray-800">1. Compose</h2>
        <div>
          <label className="label">Subject Line</label>
          <input className="input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Festive Season Offer — Flat 20% Off!" />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea className="input resize-none" rows="8" value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your offer or announcement here..." />
        </div>
        <button type="button" className="btn-secondary py-2 px-4 text-sm" onClick={() => setShowPreview(true)} disabled={!subject.trim() || !message.trim()}>
          Preview Email
        </button>
      </div>

      {/* Section 2 — Recipients */}
      <div className="card p-5 space-y-3">
        <h2 className="font-heading font-semibold text-gray-800">2. Recipients</h2>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer">
          <input type="checkbox" className="w-4 h-4" checked={sendToAll} onChange={e => setSendToAll(e.target.checked)} />
          <div>
            <p className="text-sm font-medium text-gray-800">Send to ALL customers with email</p>
            <p className="text-xs text-gray-400">
              {loadingCount ? 'Loading…' : `${allCount} customer${allCount === 1 ? '' : 's'} have email addresses on file`}
            </p>
          </div>
        </label>

        {!sendToAll && (
          <div className="space-y-2">
            <input
              className="input text-sm"
              placeholder="Search customers by name, phone, or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {results.length > 0 && (
              <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {results.map(c => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={selected.some(s => s.id === c.id)}
                      onChange={() => toggleSelected(c)}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{c.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{c.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {selected.length > 0 && (
              <p className="text-xs text-gray-500">{selected.length} customer{selected.length === 1 ? '' : 's'} selected</p>
            )}
          </div>
        )}
      </div>

      {/* Section 3 — Send */}
      <div className="card p-5 space-y-3">
        <h2 className="font-heading font-semibold text-gray-800">3. Send</h2>
        <p className="text-sm text-gray-500">
          Will send to <span className="font-medium text-gray-800">{recipientCount ?? '…'}</span> recipient{recipientCount === 1 ? '' : 's'}.
        </p>
        <button
          onClick={send}
          disabled={sending}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {sending ? 'Sending…' : 'Send Offer Email'}
        </button>

        {result && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm">
            <p className="font-medium">Sent to {result.sent} customer{result.sent === 1 ? '' : 's'}{result.failed ? `, ${result.failed} failed` : ''}.</p>
            {result.errors?.length > 0 && (
              <ul className="mt-1 text-xs text-red-700 list-disc list-inside">
                {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e.email}: {e.error}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-heading font-bold text-lg">Email Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-5 bg-gray-50">
              <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="bg-navy-900 px-6 py-5 text-center">
                  <h1 className="text-white font-heading font-bold text-lg tracking-wide m-0">Karan Optics</h1>
                </div>
                <div className="px-6 py-6">
                  <h2 className="text-navy-900 font-heading font-semibold text-base mb-2">{subject}</h2>
                  <p className="text-gray-600 text-sm whitespace-pre-line">{message}</p>
                </div>
                <div className="bg-gray-100 px-4 py-3 text-center text-xs text-gray-500">
                  Karan Optics | NetraKiran
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
