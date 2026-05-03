import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

export default function AdminUsers() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/admins').then(r => setUsers(r.data)).finally(() => setLoading(false))
  }, [])

  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'customer' : 'admin'
    setUpdating(u.id)
    try {
      await api.patch(`/admins/${u.id}/role`, { role: newRole })
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update role')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const admins = filtered.filter(u => u.role === 'admin')
  const customers = filtered.filter(u => u.role === 'customer')

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-navy-900">User Access Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Promote customers to admin or revoke admin access</p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">{admins.length} Admins</span>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">{customers.length} Customers</span>
        </div>
      </div>

      <input
        className="input max-w-sm"
        placeholder="Search by name or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Admins */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Admins</h3>
        <div className="card divide-y divide-gray-100">
          {admins.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No admins found</p>}
          {admins.map(u => (
            <UserRow key={u.id} u={u} me={me} updating={updating} onToggle={toggleRole} />
          ))}
        </div>
      </section>

      {/* Customers */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Customers</h3>
        <div className="card divide-y divide-gray-100">
          {customers.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No customers found</p>}
          {customers.map(u => (
            <UserRow key={u.id} u={u} me={me} updating={updating} onToggle={toggleRole} />
          ))}
        </div>
      </section>
    </div>
  )
}

function UserRow({ u, me, updating, onToggle }) {
  const isSelf = u.id === me?.id
  const isAdmin = u.role === 'admin'
  const busy = updating === u.id

  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-sm flex-shrink-0">
        {u.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm">{u.name}</span>
          {isSelf && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">You</span>}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
            {u.role}
          </span>
        </div>
        <div className="text-xs text-gray-400 truncate">{u.email}{u.phone ? ` · ${u.phone}` : ''}</div>
      </div>
      <button
        disabled={isSelf || busy}
        onClick={() => onToggle(u)}
        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          isAdmin
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
        }`}
      >
        {busy ? '…' : isAdmin ? 'Revoke Admin' : 'Make Admin'}
      </button>
    </div>
  )
}
