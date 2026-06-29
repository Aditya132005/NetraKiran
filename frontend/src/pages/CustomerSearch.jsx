import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

export default function CustomerSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/customer-profiles/search?q=${encodeURIComponent(query)}`)
        setResults(data)
        setSearched(true)
      } catch {}
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  return (
    <div className="min-h-[80vh] bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-navy-800 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <h1 className="font-heading text-3xl font-bold text-navy-900 mb-2">Customer Lookup</h1>
          <p className="text-gray-500">Search by name, phone number, or email address</p>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input
            autoFocus
            className="w-full pl-12 pr-12 py-4 text-base border-2 border-gray-200 rounded-xl focus:border-navy-500 focus:outline-none transition-colors bg-white shadow-sm placeholder-gray-400"
            placeholder="Type name, phone number, or email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-navy-600 border-t-transparent rounded-full animate-spin"/>
          )}
        </div>

        {/* Register Button */}
        <div className="flex justify-end mb-6">
          <Link
            to="/customer-register"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            Register New Customer
          </Link>
        </div>

        {/* No results state */}
        {searched && !loading && results.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-gray-700">No customer found</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">No match for "{query}"</p>
            <Link
              to="/customer-register"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              Register as New Customer
            </Link>
          </div>
        )}

        {/* Results list */}
        <div className="space-y-3">
          {results.map(c => (
            <div key={c.id} className="card p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-navy-100 flex items-center justify-center text-navy-800 font-bold text-base flex-shrink-0 uppercase">
                  {c.full_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {c.title ? `${c.title} ` : ''}{c.full_name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {c.phone}{c.email ? ` · ${c.email}` : ''}
                  </p>
                </div>
              </div>
              <Link
                to={`/customer/${c.id}`}
                className="flex-shrink-0 bg-navy-800 hover:bg-navy-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                View Profile
              </Link>
            </div>
          ))}
        </div>

        {/* Empty initial state */}
        {!query && (
          <div className="text-center mt-12 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <p className="text-sm">Start typing to search customers</p>
          </div>
        )}

      </div>
    </div>
  )
}
