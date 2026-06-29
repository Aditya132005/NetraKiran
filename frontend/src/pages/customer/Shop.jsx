import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../utils/api'
import { useCart } from '../../context/CartContext'

const CATEGORIES = [
  { value:'all', label:'All Products', icon:'🔭' },
  { value:'frame', label:'Frames', icon:'👓' },
  { value:'sunglasses', label:'Sunglasses', icon:'🕶️' },
  { value:'lens', label:'Lenses', icon:'🔬' },
]

const BRAND_CHIPS = [
  'Ray-Ban', 'Oakley', 'Titan', 'Fastrack', 'Vincent Chase',
  'Lenskart', 'Zeiss', 'Essilor', 'Nikon', 'Hoya', 'Ribbons',
]

const BRANDS = ['All Brands', ...BRAND_CHIPS, 'Vogue', 'Transitions', 'John Jacobs', 'Police']
const GENDER_OPTS = ['All','unisex','male','female']

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(params.get('category') || 'all')
  const [brand, setBrand] = useState('All Brands')
  const [gender, setGender] = useState('All')
  const [search, setSearch] = useState('')
  const [trending, setTrending] = useState(false)
  const [added, setAdded] = useState({})
  const { addItem } = useCart()

  useEffect(() => {
    setLoading(true)
    const q = new URLSearchParams()
    if (category !== 'all') q.set('category', category)
    if (trending) q.set('trending', 'true')
    if (search) q.set('search', search)
    api.get(`/products?${q}`).then(r => setProducts(r.data)).finally(() => setLoading(false))
  }, [category, trending, search])

  const handleAdd = (p) => {
    addItem(p)
    setAdded(prev => ({ ...prev, [p.id]: true }))
    setTimeout(() => setAdded(prev => ({ ...prev, [p.id]: false })), 1500)
  }

  const filtered = products.filter(p => {
    if (brand !== 'All Brands' && p.brand !== brand) return false
    if (gender !== 'All' && p.gender !== 'unisex' && p.gender !== gender) return false
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-navy-900">Shop Eyewear</h1>
        <p className="text-gray-500 text-sm mt-1">Premium frames, sunglasses & lenses — all top brands</p>
      </div>

      {/* ── Browse by Brand chips ── */}
      <div className="mb-7">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Browse by Brand</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setBrand('All Brands')}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${brand === 'All Brands'
              ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300 hover:text-navy-700'}`}>
            All Brands
          </button>
          {BRAND_CHIPS.map(b => (
            <button
              key={b}
              onClick={() => setBrand(brand === b ? 'All Brands' : b)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${brand === b
                ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300 hover:text-navy-700'}`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => { setCategory(c.value); setParams(c.value !== 'all' ? { category: c.value } : {}) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${category===c.value ? 'bg-navy-800 text-white border-navy-800 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            <span>{c.icon}</span>{c.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="card p-4 sticky top-24 space-y-5">
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Brand</h4>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {BRANDS.map(b => (
                  <label key={b} className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="brand" checked={brand===b} onChange={() => setBrand(b)} className="accent-navy-800"/>
                    <span className={`text-sm ${brand===b ? 'font-medium text-navy-800' : 'text-gray-600 group-hover:text-gray-800'}`}>{b}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Gender</h4>
              <div className="space-y-1.5">
                {GENDER_OPTS.map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="gender" checked={gender===g} onChange={() => setGender(g)} className="accent-navy-800"/>
                    <span className={`text-sm capitalize ${gender===g ? 'font-medium text-navy-800' : 'text-gray-600 group-hover:text-gray-800'}`}>{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={trending} onChange={e => setTrending(e.target.checked)} className="accent-navy-800 w-4 h-4"/>
                <span className="text-sm font-medium text-gray-700">Trending Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {/* Search */}
          <div className="relative mb-5">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/></svg>
            <input className="input pl-9" placeholder="Search by name, brand, description…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {loading ? 'Loading…' : `${filtered.length} products found`}
            </p>
            {brand !== 'All Brands' && (
              <button onClick={() => setBrand('All Brands')} className="text-xs text-navy-600 hover:text-navy-800 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                Clear brand filter
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {Array(6).fill(0).map((_,i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"/>
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/2"/>
                    <div className="h-4 bg-gray-200 rounded"/>
                    <div className="h-4 bg-gray-200 rounded w-2/3"/>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-500 font-medium">No products found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {filtered.map(p => {
                const disc = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0
                const features = p.features ? p.features.split(',') : []
                return (
                  <div key={p.id} className="card overflow-hidden group flex flex-col">
                    {/* Image */}
                    <div className="relative overflow-hidden bg-gray-100 h-52">
                      <img src={p.image_url || 'https://via.placeholder.com/400x300?text=Eyewear'} alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { e.target.src = 'https://via.placeholder.com/400x300?text=Eyewear' }}
                      />
                      {p.trending === 1 && <span className="absolute top-2 left-2 bg-gold-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Trending</span>}
                      {disc > 0 && <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{disc}% OFF</span>}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">{p.brand}</p>
                          <h3 className="font-medium text-gray-900 text-sm leading-snug">{p.name}</h3>
                        </div>
                      </div>

                      {/* Type pill */}
                      <div className="flex flex-wrap gap-1 my-2">
                        {(p.frame_type || p.lens_type) && (
                          <span className="text-[10px] bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full">{p.frame_type || p.lens_type}</span>
                        )}
                        {p.gender !== 'unisex' && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{p.gender}</span>
                        )}
                      </div>

                      {/* Features */}
                      {features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {features.slice(0,3).map(f => (
                            <span key={f} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">{f.trim()}</span>
                          ))}
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3 mt-auto">
                        <span className="text-lg font-bold text-navy-800">₹{p.price?.toLocaleString()}</span>
                        {p.original_price && <span className="text-gray-400 text-xs line-through">₹{p.original_price?.toLocaleString()}</span>}
                      </div>

                      <button onClick={() => handleAdd(p)}
                        className={`w-full text-sm py-2.5 rounded-lg font-medium transition-all duration-200 ${added[p.id] ? 'bg-green-600 text-white' : 'bg-navy-800 hover:bg-navy-900 text-white'}`}>
                        {added[p.id] ? '✓ Added to Cart' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
